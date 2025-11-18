import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import 'react-quill/dist/quill.bubble.css';

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{'color': []}, {'background': []}],
    [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
    [{ 'align': [] }],
    ['link', 'image', 'code-block'],
    ['clean']
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'list', 'bullet', 'indent',
  'align',
  'link', 'image', 'code-block'
];

export default function RichTextEditor({ value, onChange, placeholder, theme = 'snow', ...props }) {
  return (
    <div className="bg-slate-900 text-slate-100 rounded-[var(--radius)]">
       <ReactQuill 
        theme={theme}
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="[&_.ql-editor]:min-h-[250px] [&_.ql-toolbar]:border-slate-700 [&_.ql-container]:border-slate-700"
        {...props}
      />
    </div>
  );
}