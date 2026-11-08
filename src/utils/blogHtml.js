/**
 * Isi blog ditulis dengan editor teks kaya dan ditampilkan sebagai HTML.
 * Semua isi dibersihkan di server sebelum disimpan: tanpa <script>, atribut on*, javascript:, iframe asing.
 * (Dulu HTML mentah disimpan dan ditampilkan langsung: siapa pun yang bisa menulis blog bisa menyisipkan skrip.)
 */
import sanitizeHtml from 'sanitize-html';

const OPTIONS = {
  allowedTags: [
    'p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'pre', 'code', 'span',
    'strong', 'b', 'em', 'i', 'u', 's', 'mark', 'sub', 'sup',
    'ul', 'ol', 'li', 'a', 'img', 'figure', 'figcaption',
    'table', 'thead', 'tbody', 'tr', 'th', 'td'
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    '*': ['class']
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['http', 'https'] },
  allowProtocolRelative: false,
  transformTags: {
    a: (tag, attribs) => ({ tagName: 'a', attribs: { ...attribs, rel: 'noopener noreferrer nofollow', ...(attribs.target ? { target: '_blank' } : {}) } }),
    img: (tag, attribs) => ({ tagName: 'img', attribs: { ...attribs, loading: 'lazy' } })
  },
  // Gambar unggahan sendiri disimpan sebagai path relatif /uploads/...
  exclusiveFilter: (frame) => frame.tag === 'img' && !/^(https?:\/\/|\/uploads\/|\/api\/uploads\/)/.test(frame.attribs.src || '')
};

export function cleanBlogHtml(html) {
  return sanitizeHtml(String(html || ''), {
    ...OPTIONS,
    allowedSchemesAppliedToAttributes: ['href', 'src'],
    // Path relatif /uploads/... juga diizinkan untuk gambar
    allowedSchemesByTag: { img: ['http', 'https'], a: ['http', 'https', 'mailto'] },
    allowRelative: true
  });
}

/** Teks polos (ringkasan, judul, komentar): semua tag dibuang. */
export function plainText(s, max = 5000) {
  return sanitizeHtml(String(s || ''), { allowedTags: [], allowedAttributes: {} }).replace(/\s+\n/g, '\n').trim().slice(0, max);
}
