import { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { getPublicSettings } from '@/api/candidates';
import { Loader2 } from 'lucide-react';
import SEO from '@/components/common/SEO';
import styles from './CustomPage.module.css';

/* ── Render blok page builder (Notion-like width + align) ── */
function BlockRenderer({ block }) {
  const p = block.props || {};
  const widthPct = p.width != null && p.width < 100 ? `${p.width}%` : '100%';
  const wrapStyle = { width: widthPct, maxWidth: '100%', marginBottom: `${p.marginBottom || 0}px` };
  if (p.align === 'center') { wrapStyle.marginLeft = 'auto'; wrapStyle.marginRight = 'auto'; }
  else if (p.align === 'right') { wrapStyle.marginLeft = 'auto'; }

  if (block.type === 'heading') {
    const Tag = p.level || 'h2';
    return (
      <div style={wrapStyle}>
        <Tag style={{ fontSize: `${p.fontSize || 2}rem`, color: p.color || 'inherit', fontWeight: p.fontWeight || '700', textAlign: p.align || 'left', margin: 0 }}>
          {p.text || ''}
        </Tag>
      </div>
    );
  }
  if (block.type === 'paragraph') {
    return (
      <div style={wrapStyle}>
        <p style={{ fontSize: `${p.fontSize || 1}rem`, color: p.color || 'inherit', lineHeight: p.lineHeight || 1.7, textAlign: p.align || 'left', margin: 0 }}>
          {p.text || ''}
        </p>
      </div>
    );
  }
  if (block.type === 'image') {
    if (!p.src) return null;
    return (
      <div style={wrapStyle}>
        <img src={p.src} alt={p.alt || ''} style={{ width: '100%', maxWidth: '100%', borderRadius: `${p.borderRadius || 8}px`, display: 'block' }} />
      </div>
    );
  }
  if (block.type === 'button') {
    const btnStyle = {
      display: 'inline-block',
      padding: `${p.paddingY || 10}px ${p.paddingX || 24}px`,
      fontSize: `${p.fontSize || 0.95}rem`,
      borderRadius: `${p.borderRadius || 6}px`,
      fontWeight: 600,
      textDecoration: 'none',
      opacity: (p.opacity || 100) / 100,
    };
    if (p.style === 'outline') {
      btnStyle.background = 'transparent'; btnStyle.color = p.bgColor || '#6366f1'; btnStyle.border = `2px solid ${p.bgColor || '#6366f1'}`;
    } else if (p.style === 'ghost') {
      btnStyle.background = 'transparent'; btnStyle.color = p.bgColor || '#6366f1'; btnStyle.border = 'none';
    } else {
      btnStyle.background = p.bgColor || '#6366f1'; btnStyle.color = p.textColor || '#fff'; btnStyle.border = 'none';
    }
    return (
      <div style={{ ...wrapStyle, textAlign: p.align || 'left' }}>
        <a href={p.href || '#'} style={btnStyle}>{p.label || 'Tombol'}</a>
      </div>
    );
  }
  if (block.type === 'divider') {
    return (
      <div style={wrapStyle}>
        <hr style={{ border: 'none', borderTop: `${p.thickness || 1}px ${p.style || 'solid'} ${p.color || '#e5e7eb'}`, margin: 0 }} />
      </div>
    );
  }
  if (block.type === 'spacer') {
    return <div style={{ height: `${p.height || 32}px` }} aria-hidden="true" />;
  }
  if (block.type === 'columns') {
    return (
      <div style={{ ...wrapStyle, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: `${p.gap || 24}px` }}>
        <div dangerouslySetInnerHTML={{ __html: p.col1 || '' }} />
        <div dangerouslySetInnerHTML={{ __html: p.col2 || '' }} />
      </div>
    );
  }
  if (block.type === 'html') {
    return <div style={wrapStyle} dangerouslySetInnerHTML={{ __html: p.html || '' }} />;
  }
  return null;
}

export default function CustomPage() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [pageData, setPageData] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await getPublicSettings();
        if (res.data?.webEditorConfig?.customPages) {
          const pages = res.data.webEditorConfig.customPages;
          const found = pages.find(p => p.slug === slug);
          if (found) {
            setPageData(found);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [slug]);

  if (loading) {
    return (
      <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 className="spinner" size={32} />
      </div>
    );
  }

  if (!pageData) {
    return <Navigate to="/404" replace />;
  }

  // Render blocks jika ada, fallback ke HTML legacy
  const hasBlocks = pageData.blocks && pageData.blocks.length > 0;

  return (
    <div className="page-wrapper">
      <SEO title={pageData.title} description={pageData.description} />
      <section className="section">
        <div className={`container ${styles.content}`}>
          {hasBlocks ? (
            pageData.blocks.map((block) => (
              <BlockRenderer key={block.id} block={block} />
            ))
          ) : (
            <div dangerouslySetInnerHTML={{ 
              __html: (() => {
                if (!pageData.html) return '';
                const cleanBase = window.location.hostname === 'localhost' 
                  ? 'http://localhost:25552/uploads' 
                  : `${window.location.origin}/api/uploads`;
                return pageData.html.replace(/src="\/uploads\//g, `src="${cleanBase}/`);
              })()
            }} />
          )}
        </div>
      </section>
    </div>
  );
}
