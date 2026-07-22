import React, { useState, useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import {
  Folder,
  FileText,
  Image,
  Video,
  HardDrive,
  Upload,
  Plus,
  Search,
  Trash2,
  Grid,
  List,
  FileCode,
  FileArchive,
  LogOut,
  User,
  Menu,
  Eye,
  Download,
  X,
  Edit,
  Share2,
  Move,
} from "lucide-react";
// Import your logout action (adjust path)
import { logout } from "../redux/slices/authSlice"; // example

const API_BASE_URL =  import.meta.env.VITE_BACKEND_URL;

export default function Dashboard() {
  const dispatch = useDispatch();
  // Get user from Redux
  const { user, loading } = useSelector((state) => state.auth);

  // ---------- Local UI state ----------
  const [viewMode, setViewMode] = useState("grid");
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [storageStats, setStorageStats] = useState({
    used: 0,
    total: 10 * 1024 * 1024 * 1024, // 10 GB
  });
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [folderPath, setFolderPath] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // ---------- Profile dropdown ----------
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // ---------- Move Modal State ----------
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [moveItem, setMoveItem] = useState(null);
  const [allFolders, setAllFolders] = useState([]);
  const [selectedDestFolderId, setSelectedDestFolderId] = useState(null);
  const [loadingFolders, setLoadingFolders] = useState(false);

  // ---------- Context menu ----------
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    item: null,
  });

  // ---------- Toast ----------
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });
  const toastTimer = useRef(null);

  const showToast = useCallback((message, type = "info", duration = 3000) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ visible: true, message, type });
    toastTimer.current = setTimeout(() => {
      setToast({ visible: false });
      toastTimer.current = null;
    }, duration);
  }, []);

  // ---------- Create Folder Modal ----------
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // ---------- Rename Folder Modal ----------
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameItem, setRenameItem] = useState(null);
  const [renameNewName, setRenameNewName] = useState("");

  // ---------- Confirm Modal ----------
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    title: "",
    message: "",
    onConfirm: null,
  });

  // ---------- Authentication ----------
  const handleLogOut = async () => {
    try {
      // Call logout API
      await axios.post(
        `${API_BASE_URL}/auth/logout`,
        {},
        { withCredentials: true }
      );
      // Clear Redux state (dispatch logout action)
      dispatch(logout());
      // Redirect to login
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout error:", err);
      showToast("Logout failed. Please try again.", "error");
    }
  };

  // ---------- Fetch drive content ----------
  const fetchDriveContent = useCallback(async () => {
    setIsLoading(true);
    try {
      const filesResponse = await axios.get(`${API_BASE_URL}/file/get-files`, {
        withCredentials: true,
      });
      const fetchedFiles = filesResponse.data.files || [];

      const mappedFiles = fetchedFiles.map((file) => ({
        ...file,
        _id: file._id || file.id,
        name: file.name || file.originalName || file.fileName || "Unnamed",
        size: file.size || file.fileSize || 0,
        mimeType: file.mimeType || file.type || "application/octet-stream",
        createdAt: file.createdAt || file.uploadedAt || new Date().toISOString(),
        type: "file",
        parentFolderId: file.parentFolderId || file.folderId || null,
      }));

      let mappedFolders = [];
      try {
        const foldersResponse = await axios.get(
          `${API_BASE_URL}/folder/get-folders`,
          {
            params: { parentFolder: currentFolderId },
            withCredentials: true,
          }
        );
        const fetchedFolders = foldersResponse.data.folders || [];
        mappedFolders = fetchedFolders.map((folder) => ({
          ...folder,
          _id: folder._id || folder.id,
          name: folder.folderName || "Unnamed Folder",
          createdAt: folder.createdAt || new Date().toISOString(),
          type: "folder",
          parentFolderId: folder.parentFolderId || null,
        }));
      } catch (folderErr) {
        console.warn("Folder API not available – skipping folders", folderErr);
      }

      const filteredFiles = mappedFiles.filter(
        (file) => file.parentFolderId === currentFolderId
      );

      const combined = [...mappedFolders, ...filteredFiles];
      setItems(combined);

      const totalUsed = mappedFiles.reduce((acc, f) => acc + (f.size || 0), 0);
      setStorageStats((prev) => ({
        ...prev,
        used: totalUsed,
      }));
    } catch (err) {
      console.error("Error fetching drive content:", err);
      showToast("Failed to load drive content.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [currentFolderId, showToast]);

  // ---------- Upload ----------
  const uploadLargeFile = async (file) => {
    const chunkSize = 10 * 1024 * 1024;
    const totalSize = file.size;
    let uploadedBytes = 0;

    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/file/multipart-start`,
        {
          fileName: file.name,
          type: file.type,
          size: file.size,
          folderId: currentFolderId,
        },
        { withCredentials: true }
      );

      const { uploadId, key } = data;
      let parts = [];
      let partNumber = 1;

      for (let start = 0; start < file.size; start += chunkSize) {
        const chunk = file.slice(start, start + chunkSize);
        const urlResponse = await axios.post(
          `${API_BASE_URL}/file/get-multiPart-url`,
          { uploadId, key, partNumber },
          { withCredentials: true }
        );
        const { url } = urlResponse.data;

        const uploadResponse = await axios.put(url, chunk, {
          headers: { "Content-Type": file.type },
          onUploadProgress: (progressEvent) => {
            const chunkProgress = progressEvent.loaded;
            const totalSoFar = uploadedBytes + chunkProgress;
            const percent = Math.round((totalSoFar / totalSize) * 100);
            setProgress(Math.min(percent, 100));
          },
        });

        parts.push({
          PartNumber: partNumber,
          ETag: uploadResponse.headers.etag,
        });

        uploadedBytes += chunk.size;
        partNumber++;
      }

      await axios.post(
        `${API_BASE_URL}/file/multipart/complete`,
        { uploadId, key, parts },
        { withCredentials: true }
      );
    } catch (error) {
      console.error("Multipart upload failed:", error);
      throw error;
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (storageStats.used + file.size > storageStats.total) {
      showToast(
        "Insufficient storage space. Please free up some space and try again.",
        "error"
      );
      event.target.value = "";
      return;
    }

    const LIMIT = 70 * 1024 * 1024;
    try {
      setUploading(true);
      setProgress(0);

      if (file.size <= LIMIT) {
        const { data } = await axios.post(
          `${API_BASE_URL}/file/upload-url`,
          {
            fileName: file.name,
            type: file.type,
            size: file.size,
            folderId: currentFolderId,
          },
          { withCredentials: true }
        );

        await axios.put(data.uploadUrl, file, {
          headers: { "Content-Type": file.type },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            );
            setProgress(percent);
          },
        });
      } else {
        await uploadLargeFile(file);
      }

      showToast("File uploaded successfully!", "success");
      fetchDriveContent();
    } catch (err) {
      console.error("Upload failed:", err);
      showToast(err.response?.data?.message || "Upload failed.", "error");
    } finally {
      setUploading(false);
      setProgress(0);
    }

    event.target.value = "";
  };

  // ---------- Folder operations ----------
  const handleCreateFolder = () => {
    setNewFolderName("");
    setIsCreateFolderModalOpen(true);
  };

  const handleCreateFolderSubmit = async () => {
    if (!newFolderName.trim()) {
      showToast("Folder name is required.", "error");
      return;
    }
    try {
      await axios.post(
        `${API_BASE_URL}/folder/create-folder`,
        { folderName: newFolderName.trim(), parentFolderId: currentFolderId },
        { withCredentials: true }
      );
      showToast("Folder created successfully!", "success");
      fetchDriveContent();
      setIsCreateFolderModalOpen(false);
      setNewFolderName("");
    } catch (err) {
      console.error("Error creating folder:", err);
      showToast("Failed to create folder.", "error");
    }
  };

  const openRenameModal = (folder) => {
    setRenameItem(folder);
    setRenameNewName(folder.name);
    setIsRenameModalOpen(true);
  };

  const handleRenameSubmit = async () => {
    if (!renameNewName.trim() || renameNewName === renameItem.name) {
      setIsRenameModalOpen(false);
      return;
    }
    try {
      await axios.put(
        `${API_BASE_URL}/folder/rename-folder/${renameItem._id}`,
        { folderName: renameNewName.trim() },
        { withCredentials: true }
      );
      showToast("Folder renamed successfully!", "success");
      fetchDriveContent();
      setIsRenameModalOpen(false);
    } catch (err) {
      console.error("Rename error:", err);
      showToast("Failed to rename folder.", "error");
    }
  };

  // ---------- Delete with confirm modal ----------
  const openConfirmModal = useCallback((title, message, onConfirm) => {
    setConfirmConfig({ title, message, onConfirm });
    setIsConfirmModalOpen(true);
  }, []);

  const handleConfirmAction = () => {
    if (confirmConfig.onConfirm) {
      confirmConfig.onConfirm();
    }
    setIsConfirmModalOpen(false);
  };

  const handleDeleteFolder = (folderId) => {
    openConfirmModal(
      "Delete Folder",
      "Are you sure you want to delete this folder and all its contents? This action cannot be undone.",
      async () => {
        try {
          await axios.delete(
            `${API_BASE_URL}/folder/delete-folder/${folderId}`,
            { withCredentials: true }
          );
          showToast("Folder deleted successfully.", "success");
          fetchDriveContent();
        } catch (err) {
          console.error("Delete folder error:", err);
          showToast("Failed to delete folder.", "error");
        }
      }
    );
  };

  const handleDeleteFile = (fileId) => {
    openConfirmModal(
      "Delete File",
      "Are you sure you want to delete this file? This action cannot be undone.",
      async () => {
        try {
          await axios.delete(
            `${API_BASE_URL}/file/delete-file/${fileId}`,
            { withCredentials: true }
          );
          showToast("File deleted successfully.", "success");
          fetchDriveContent();
        } catch (err) {
          console.error("Delete file error:", err);
          showToast("Failed to delete file.", "error");
        }
      }
    );
  };

  // ---------- View & Download ----------
  const handleView = async (fileId) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/file/view-files`,
        { fileId },
        { withCredentials: true }
      );
      window.open(res.data.url, "_blank");
    } catch (error) {
      console.log(error);
      showToast("Failed to view file.", "error");
    }
  };

  const handleDownload = async (fileId) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/file/download-files`,
        { fileId },
        { withCredentials: true }
      );
      window.location.href = res?.data?.url;
    } catch (error) {
      console.log(error);
      showToast("Failed to download file.", "error");
    }
  };

  // ---------- Move logic ----------
  const handleMoveItem = async (item, targetFolderId) => {
    try {
      if (item.type === "file") {
        await axios.patch(
          `${API_BASE_URL}/folder/move-file/${item._id}`,
          { folderId: targetFolderId },
          { withCredentials: true }
        );
      } else {
        await axios.patch(
          `${API_BASE_URL}/folder/move/${item._id}`,
          { parentFolderId: targetFolderId },
          { withCredentials: true }
        );
      }
      showToast("Moved successfully!", "success");
      fetchDriveContent();
    } catch (err) {
      console.error("Move error:", err);
      showToast("Failed to move item.", "error");
    }
  };

  const fetchAllFoldersRecursive = async (parentId = null, path = "My Drive") => {
    try {
      const response = await axios.get(`${API_BASE_URL}/folder/get-folders`, {
        params: { parentFolder: parentId },
        withCredentials: true,
      });
      const folders = response.data.folders || [];
      let result = [];

      for (const folder of folders) {
        const folderPath = `${path} / ${folder.folderName}`;
        result.push({
          _id: folder._id || folder.id,
          name: folder.folderName,
          path: folderPath,
        });
        const children = await fetchAllFoldersRecursive(folder._id, folderPath);
        result = result.concat(children);
      }
      return result;
    } catch (err) {
      console.warn("Error fetching folders recursively", err);
      return [];
    }
  };

  const openMoveModal = async (item) => {
    setMoveItem(item);
    setMoveModalOpen(true);
    setSelectedDestFolderId(null);
    setLoadingFolders(true);
    try {
      const folderList = await fetchAllFoldersRecursive();
      setAllFolders(folderList);
    } catch (err) {
      console.error("Failed to load folders", err);
      showToast("Could not load folder list.", "error");
    } finally {
      setLoadingFolders(false);
    }
  };

  const handleMoveConfirm = () => {
    if (!selectedDestFolderId) {
      showToast("Please select a destination folder.", "error");
      return;
    }
    handleMoveItem(moveItem, selectedDestFolderId);
    setMoveModalOpen(false);
    setMoveItem(null);
    setAllFolders([]);
    setSelectedDestFolderId(null);
    closeContextMenu();
  };

  const closeMoveModal = () => {
    setMoveModalOpen(false);
    setMoveItem(null);
    setAllFolders([]);
    setSelectedDestFolderId(null);
  };

  // ---------- Context menu ----------
  const handleContextMenu = (e, item) => {
    if (item.type !== "file") return;
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      item: item,
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, item: null });
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenu.visible) {
        closeContextMenu();
      }
      // Close profile dropdown when clicking outside
      if (showProfileDropdown) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [contextMenu.visible, showProfileDropdown]);

  const handleShare = async (item) => {
    try {
      const res = await axios.patch(
        `${API_BASE_URL}/file/share/${item._id}`,
        {},
        { withCredentials: true }
      );
      console.log(res);
      window.open(res.data.shareLink, "_blank");
    } catch (error) {
      console.log(error);
      showToast("Failed to share file.", "error");
    }
  };

  // ---------- Utilities ----------
  const formatBytes = (bytes, decimals = 2) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) +
      " " +
      ["Bytes", "KB", "MB", "GB", "TB"][i]
    );
  };

  const getFileIcon = (mimeType) => {
    if (!mimeType) return <FileText className="w-5 h-5 text-gray-500" />;
    if (mimeType.startsWith("image/"))
      return <Image className="w-5 h-5 text-emerald-500" />;
    if (mimeType.startsWith("video/"))
      return <Video className="w-5 h-5 text-purple-500" />;
    if (mimeType.includes("pdf") || mimeType.includes("document"))
      return <FileText className="w-5 h-5 text-blue-500" />;
    if (mimeType.includes("zip") || mimeType.includes("rar"))
      return <FileArchive className="w-5 h-5 text-amber-600" />;
    if (mimeType.includes("javascript") || mimeType.includes("json"))
      return <FileCode className="w-5 h-5 text-orange-500" />;
    return <FileText className="w-5 h-5 text-gray-500" />;
  };

  useEffect(() => {
    fetchDriveContent();
  }, [fetchDriveContent]);

  const storagePercentage = Math.min(
    Math.round((storageStats.used / storageStats.total) * 100),
    100
  );

  const filteredItems = items.filter((item) =>
    item.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get user initial
  const getUserInitial = () => {
    if (user?.name) return user.name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return "U";
  };

  // ---------- Render ----------
  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800 selection:bg-indigo-100">
      {/* Toast Notification */}
      {toast.visible && (
        <div
          className={`fixed top-4 right-4 z-[9999] max-w-sm w-full px-4 py-3 rounded-lg shadow-lg border-l-4 transition-all duration-300 ${
            toast.type === "success"
              ? "bg-green-50 border-green-500 text-green-800"
              : toast.type === "error"
              ? "bg-red-50 border-red-500 text-red-800"
              : "bg-blue-50 border-blue-500 text-blue-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="font-medium">{toast.message}</span>
            <button
              onClick={() => setToast({ visible: false })}
              className="ml-auto text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed md:relative z-50 w-64 bg-white border-r border-gray-200 flex flex-col justify-between
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:flex h-full
        `}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div
              onClick={() => {
                setCurrentFolderId(null);
                setFolderPath([]);
                setSidebarOpen(false);
              }}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div className="p-2 bg-indigo-600 rounded-lg text-white group-hover:bg-indigo-700 transition">
                <HardDrive className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900">
                CloudVault
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1 rounded hover:bg-gray-100"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="space-y-2 mb-6">
            <label className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-xl shadow-xs transition-all cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Upload File</span>
              <input
                type="file"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {uploading && (
              <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Uploading…</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleCreateFolder}
              className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-4 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Folder</span>
            </button>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => {
                setCurrentFolderId(null);
                setFolderPath([]);
                setSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg bg-indigo-50 text-indigo-700 font-medium text-left cursor-pointer"
            >
              <HardDrive className="w-5 h-5" /> My Drive
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-gray-100 space-y-4">
          <div>
            <div className="flex justify-between text-xs font-medium text-gray-500 mb-1.5">
              <span>Storage Used</span>
              <span>{storagePercentage}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1.5">
              <div
                className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${storagePercentage}%` }}
              />
            </div>
            <p className="text-[11px] text-gray-400">
              {formatBytes(storageStats.used)} of{" "}
              {formatBytes(storageStats.total)}
            </p>
          </div>
          <button
            onClick={handleLogOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-600 hover:bg-red-50 font-medium transition text-left cursor-pointer"
          >
            <LogOut className="w-5 h-5 text-red-500" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 shadow-xs">
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 rounded hover:bg-gray-100"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div className="relative w-full max-w-md">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files and folders..."
                className="w-full pl-10 pr-10 py-2 bg-gray-100 focus:bg-white border border-transparent focus:border-gray-300 rounded-lg outline-none transition text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 relative">
            <button
              onClick={(e) => {
                e.stopPropagation(); // prevent closing immediately
                setShowProfileDropdown(!showProfileDropdown);
              }}
              className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm border border-indigo-200 hover:bg-indigo-200 transition cursor-pointer"
              title="Profile"
            >
              {getUserInitial()}
            </button>

            {/* Profile Dropdown */}
            {showProfileDropdown && (
              <div
                className="absolute right-0 top-12 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20"
                onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
              >
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.name || user?.email || "User"}
                  </p>
                  {user?.email && (
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  )}
                </div>
                <button
                  onClick={handleLogOut}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* Breadcrumb and view toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <span
                className={`cursor-pointer hover:text-gray-700 ${
                  folderPath.length === 0 ? "font-semibold text-gray-900" : ""
                }`}
                onClick={() => {
                  setFolderPath([]);
                  setCurrentFolderId(null);
                }}
              >
                My Drive
              </span>
              {folderPath.map((folder, index) => (
                <React.Fragment key={folder.id}>
                  <span className="text-gray-300">/</span>
                  <span
                    className={`cursor-pointer hover:text-gray-700 ${
                      index === folderPath.length - 1
                        ? "font-semibold text-gray-900"
                        : ""
                    }`}
                    onClick={() => {
                      setFolderPath(folderPath.slice(0, index + 1));
                      setCurrentFolderId(folder.id);
                    }}
                  >
                    {folder.name}
                  </span>
                </React.Fragment>
              ))}
            </div>
            <div className="flex bg-gray-200 p-0.5 rounded-lg select-none">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md ${
                  viewMode === "grid"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-500"
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md ${
                  viewMode === "list"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-500"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {isLoading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          )}

          {!isLoading && (
            <>
              {filteredItems.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400 text-sm">
                  This space is empty. Upload items or create a folder to start.
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredItems.map((item) => {
                    if (item.type === "folder") {
                      return (
                        <div
                          key={item._id}
                          onClick={() => {
                            setFolderPath([
                              ...folderPath,
                              { id: item._id, name: item.name },
                            ]);
                            setCurrentFolderId(item._id);
                          }}
                          className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs hover:shadow-sm transition group cursor-pointer"
                        >
                          <div className="h-28 bg-amber-50 flex items-center justify-center border-b border-gray-100 relative">
                            <Folder className="w-12 h-12 text-amber-500 fill-amber-500" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openRenameModal(item);
                              }}
                              className="absolute top-2 left-2 text-gray-500 hover:text-indigo-600 p-1.5 bg-white/90 rounded-lg shadow cursor-pointer"
                              title="Rename Folder"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFolder(item._id);
                              }}
                              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1.5 bg-white/90 rounded-lg shadow cursor-pointer"
                              title="Delete Folder"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="p-3">
                            <p
                              className="text-sm font-medium text-gray-900 truncate"
                              title={item.name}
                            >
                              {item.name}
                            </p>
                            <div className="flex justify-between text-[11px] text-gray-400 mt-1 select-none">
                              <span>Folder</span>
                              <span>
                                {new Date(item.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div
                          key={item._id}
                          onContextMenu={(e) => handleContextMenu(e, item)}
                          className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs hover:shadow-sm transition group"
                        >
                          <div className="h-28 bg-gray-50 flex items-center justify-center border-b border-gray-100 relative">
                            {getFileIcon(item.mimeType)}
                            <button
                              onClick={() => handleView(item._id)}
                              className="absolute top-2 left-2 text-blue-500 hover:text-blue-700 p-1.5 bg-white/90 rounded-lg shadow cursor-pointer"
                              title="View File"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteFile(item._id)}
                              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1.5 bg-white/90 rounded-lg shadow cursor-pointer"
                              title="Delete File"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="p-3">
                            <p
                              className="text-sm font-medium text-gray-900 truncate"
                              title={item.name}
                            >
                              {item.name}
                            </p>
                            <div className="flex justify-between text-[11px] text-gray-400 mt-1 select-none">
                              <span>{formatBytes(item.size)}</span>
                              <span>
                                {new Date(item.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <button
                              onClick={() => handleDownload(item._id)}
                              className="mt-3 w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 rounded-lg py-2 text-sm cursor-pointer"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </button>
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-400 uppercase select-none">
                        <th className="py-3 px-4">Name</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Date Added</th>
                        <th className="py-3 px-4">Size</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {filteredItems.map((item) => (
                        <tr
                          key={item._id}
                          onContextMenu={(e) =>
                            item.type === "file" && handleContextMenu(e, item)
                          }
                          className="hover:bg-gray-50 group"
                        >
                          <td className="py-3 px-4 flex items-center gap-3 font-medium text-gray-900">
                            {item.type === "folder" ? (
                              <Folder className="w-5 h-5 text-amber-500 fill-amber-500" />
                            ) : (
                              getFileIcon(item.mimeType)
                            )}
                            <span
                              className={
                                item.type === "folder"
                                  ? "cursor-pointer hover:text-indigo-600"
                                  : ""
                              }
                              onClick={() => {
                                if (item.type === "folder") {
                                  setFolderPath([
                                    ...folderPath,
                                    { id: item._id, name: item.name },
                                  ]);
                                  setCurrentFolderId(item._id);
                                }
                              }}
                            >
                              {item.name}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-500 capitalize">
                            {item.type}
                          </td>
                          <td className="py-3 px-4 text-gray-500">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-gray-500">
                            {item.type === "folder"
                              ? "—"
                              : formatBytes(item.size)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-3">
                              {item.type === "folder" ? (
                                <>
                                  <Edit
                                    onClick={() => openRenameModal(item)}
                                    className="text-indigo-500 cursor-pointer hover:text-indigo-700"
                                    title="Rename"
                                  />
                                  <Trash2
                                    onClick={() => handleDeleteFolder(item._id)}
                                    className="text-red-400 cursor-pointer hover:text-red-600"
                                    title="Delete"
                                  />
                                </>
                              ) : (
                                <>
                                  <Eye
                                    onClick={() => handleView(item._id)}
                                    className="text-blue-600 cursor-pointer hover:text-blue-800"
                                    title="View"
                                  />
                                  <Download
                                    onClick={() => handleDownload(item._id)}
                                    className="text-green-600 cursor-pointer hover:text-green-800"
                                    title="Download"
                                  />
                                  <Trash2
                                    onClick={() => handleDeleteFile(item._id)}
                                    className="text-red-400 cursor-pointer hover:text-red-600"
                                    title="Delete"
                                  />
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Context Menu */}
      {contextMenu.visible && contextMenu.item && (
        <div
          className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={() => handleShare(contextMenu.item)}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <button
            onClick={() => openMoveModal(contextMenu.item)}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Move className="w-4 h-4" />
            Move to folder
          </button>
        </div>
      )}

      {/* ---------- MODALS ---------- */}

      {/* Move Modal */}
      {moveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 p-6 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Move “{moveItem?.name}” to…
              </h3>
              <button
                onClick={closeMoveModal}
                className="p-1 rounded hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {loadingFolders ? (
              <div className="py-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto -mx-2 px-2">
                {allFolders.length === 0 ? (
                  <p className="text-center text-gray-400 py-4">
                    No folders found.
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-50">
                    {allFolders.map((folder) => (
                      <li
                        key={folder._id}
                        onClick={() => setSelectedDestFolderId(folder._id)}
                        className={`flex items-center justify-between py-2 px-2 rounded-lg cursor-pointer transition ${
                          selectedDestFolderId === folder._id
                            ? "bg-indigo-50 border-indigo-200"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Folder className="w-5 h-5 text-amber-500 fill-amber-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {folder.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {folder.path}
                            </p>
                          </div>
                        </div>
                        {selectedDestFolderId === folder._id && (
                          <span className="text-indigo-600 text-sm font-medium">
                            Selected
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
              <button
                onClick={closeMoveModal}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleMoveConfirm}
                disabled={!selectedDestFolderId || loadingFolders}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition ${
                  !selectedDestFolderId || loadingFolders
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                Move
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {isCreateFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Create New Folder
              </h3>
              <button
                onClick={() => setIsCreateFolderModalOpen(false)}
                className="p-1 rounded hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Folder Name
              </label>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleCreateFolderSubmit()}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
              <button
                onClick={() => setIsCreateFolderModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolderSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Folder Modal */}
      {isRenameModalOpen && renameItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Rename Folder
              </h3>
              <button
                onClick={() => setIsRenameModalOpen(false)}
                className="p-1 rounded hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Name
              </label>
              <input
                type="text"
                value={renameNewName}
                onChange={(e) => setRenameNewName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit()}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
              <button
                onClick={() => setIsRenameModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {confirmConfig.title}
              </h3>
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="p-1 rounded hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-600">{confirmConfig.message}</p>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}