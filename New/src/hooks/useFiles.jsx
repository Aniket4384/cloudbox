import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:3000";

export default function useFiles() {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFiles = async () => {
    setLoading(true);

    const res = await axios.get(`${API}/file/get-files`, {
      withCredentials: true,
    });

    setFiles(res.data.files);

    setLoading(false);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const uploadFile = async (file) => {
    const { data } = await axios.post(
      `${API}/file/upload-url`,

      {
        fileName: file.name,
        type: file.type,
        size: file.size,
      },

      {
        withCredentials: true,
      },
    );

    await axios.put(data.uploadUrl, file, {
      headers: {
        "Content-Type": file.type,
      },
    });

    fetchFiles();
  };

  const deleteItem = async (id) => {
    await axios.delete(
      `${API}/file/delete-file/${id}`,

      {
        withCredentials: true,
      },
    );

    fetchFiles();
  };

  const viewFile = async (id) => {
    const res = await axios.post(
      `${API}/file/view-files`,

      {
        fileId: id,
      },

      {
        withCredentials: true,
      },
    );

    window.open(res.data.url);
  };

  const downloadFile = async (id) => {
    const res = await axios.post(
      `${API}/file/download-files`,

      {
        fileId: id,
      },

      {
        withCredentials: true,
      },
    );

    window.location.href = res.data.url;
  };

  const createFolder = () => {
    console.log("folder");
  };

  return {
    files,
    folders,
    loading,
    uploadFile,
    deleteItem,
    viewFile,
    downloadFile,
    createFolder,
  };
}
