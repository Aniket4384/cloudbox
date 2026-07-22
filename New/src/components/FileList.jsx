export default function FileList({
  files,
  viewFile,
  deleteItem,
  downloadFile,
}) {
  return (
    <table>
      <tbody>
        {files.map((file) => (
          <tr key={file._id}>
            <td>{file.name}</td>

            <td>
              <button onClick={() => viewFile(file._id)}>View</button>

              <button onClick={() => downloadFile(file._id)}>Download</button>

              <button onClick={() => deleteItem(file._id)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
