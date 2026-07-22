import { Eye, Trash2, Download } from "lucide-react";

export default function FileCard({ file, viewFile, deleteItem, downloadFile }) {
  return (
    <div className="bg-white p-4 rounded-xl">
      <h3>{file.name}</h3>

      <div className="flex gap-3">
        <Eye onClick={() => viewFile(file._id)} />

        <Download onClick={() => downloadFile(file._id)} />

        <Trash2 onClick={() => deleteItem(file._id)} />
      </div>
    </div>
  );
}
