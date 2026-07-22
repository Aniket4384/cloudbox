import FileCard from "./FileCard";

export default function FileGrid(props) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {props.files.map((file) => (
        <FileCard key={file._id} file={file} {...props} />
      ))}
    </div>
  );
}
