import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { uploadBlogImage } from '@/api/admin';
import styles from './RichTextEditor.module.css';

export default function RichTextEditor({ content, onChange }) {
  // Custom upload adapter for CKEditor
  function uploadAdapter(loader) {
    return {
      upload: () => {
        return new Promise((resolve, reject) => {
          loader.file.then((file) => {
            const formData = new FormData();
            formData.append('image', file);

            uploadBlogImage(formData)
              .then((res) => {
                // Return image URL from backend response
                resolve({
                  default: `http://localhost:25552${res.data.imageUrl}`
                });
              })
              .catch((err) => {
                reject(err);
              });
          });
        });
      }
    };
  }

  // Bind custom adapter plugin to CKEditor instance
  function uploadPlugin(editor) {
    editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
      return uploadAdapter(loader);
    };
  }

  return (
    <div className={styles.editorContainer}>
      <CKEditor
        editor={ClassicEditor}
        config={{
          extraPlugins: [uploadPlugin],
          placeholder: 'Mulai menulis artikel...',
          toolbar: [
            'heading',
            '|',
            'bold',
            'italic',
            'link',
            'bulletedList',
            'numberedList',
            'blockQuote',
            '|',
            'imageUpload',
            'insertTable',
            'mediaEmbed',
            '|',
            'undo',
            'redo'
          ]
        }}
        data={content || ''}
        onChange={(event, editor) => {
          const data = editor.getData();
          onChange?.(data);
        }}
      />
    </div>
  );
}
