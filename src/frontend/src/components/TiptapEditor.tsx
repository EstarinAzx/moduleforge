import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useState } from 'react'

interface TiptapEditorProps {
    content: string
    onUpdate: (html: string) => void
    editable?: boolean
    autoSave?: boolean // If false, updates are immediate (for manual save mode)
}

export default function TiptapEditor({ content, onUpdate, editable = true }: TiptapEditorProps) {
    const [linkUrl, setLinkUrl] = useState('')
    const [showLinkModal, setShowLinkModal] = useState(false)

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    target: '_blank',
                    rel: 'noopener noreferrer',
                },
            }),
            Placeholder.configure({
                placeholder: 'Start writing...',
            }),
        ],
        content: content || '',
        editable,
        onUpdate: ({ editor }) => {
            // Always call onUpdate - the parent decides whether to save
            onUpdate(editor.getHTML())
        },
    })

    // Update content when it changes externally (e.g., when data loads)
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content || '')
        }
    }, [content, editor])

    if (!editor) {
        return <div className="animate-pulse h-64 bg-slate-800/50 rounded-xl" />
    }

    const addLink = () => {
        if (linkUrl) {
            editor.chain().focus().setLink({ href: linkUrl }).run()
            setLinkUrl('')
            setShowLinkModal(false)
        }
    }

    const removeLink = () => {
        editor.chain().focus().unsetLink().run()
    }

    const ToolbarButton = ({
        active,
        onClick,
        children,
    }: {
        active?: boolean
        onClick: () => void
        children: React.ReactNode
    }) => (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${active
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
        >
            {children}
        </button>
    )

    return (
        <div className="border border-slate-700/50 rounded-xl overflow-hidden bg-slate-900/50">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-1 p-3 bg-slate-800/50 border-b border-slate-700/50">
                {/* Headings */}
                <select
                    value={
                        editor.isActive('heading', { level: 1 }) ? '1' :
                            editor.isActive('heading', { level: 2 }) ? '2' :
                                editor.isActive('heading', { level: 3 }) ? '3' : '0'
                    }
                    onChange={(e) => {
                        const level = parseInt(e.target.value)
                        if (level === 0) {
                            editor.chain().focus().setParagraph().run()
                        } else {
                            editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run()
                        }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-700/50 text-slate-300 text-sm border border-slate-600/50 focus:border-teal-500/50 focus:outline-none"
                >
                    <option value="0">Paragraph</option>
                    <option value="1">H1</option>
                    <option value="2">H2</option>
                    <option value="3">H3</option>
                </select>

                <div className="w-px bg-slate-700/50 mx-1" />

                <ToolbarButton
                    active={editor.isActive('bold')}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                >
                    <span className="font-bold">B</span>
                </ToolbarButton>
                <ToolbarButton
                    active={editor.isActive('italic')}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                    <span className="italic">I</span>
                </ToolbarButton>

                <div className="w-px bg-slate-700/50 mx-1" />

                <ToolbarButton
                    active={editor.isActive('bulletList')}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                >
                    •
                </ToolbarButton>
                <ToolbarButton
                    active={editor.isActive('orderedList')}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                >
                    1.
                </ToolbarButton>

                <div className="w-px bg-slate-700/50 mx-1" />

                <ToolbarButton
                    active={editor.isActive('blockquote')}
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                >
                    "
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                >
                    —
                </ToolbarButton>

                <div className="w-px bg-slate-700/50 mx-1" />

                <ToolbarButton
                    active={editor.isActive('link')}
                    onClick={() => editor.isActive('link') ? removeLink() : setShowLinkModal(true)}
                >
                    🔗
                </ToolbarButton>
            </div>

            {/* Editor Content */}
            <EditorContent
                editor={editor}
                className="prose prose-invert max-w-none p-4 min-h-64 focus:outline-none
                    prose-headings:text-white prose-headings:font-bold
                    prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                    prose-p:text-slate-300 prose-p:leading-relaxed
                    prose-a:text-teal-400 prose-a:underline
                    prose-blockquote:border-l-4 prose-blockquote:border-teal-500/50 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-400
                    prose-ul:text-slate-300 prose-ol:text-slate-300
                    prose-li:marker:text-teal-500/50
                    prose-strong:text-white prose-em:text-slate-200"
            />

            {/* Link Modal */}
            {showLinkModal && (
                <div className="modal-overlay" onClick={() => setShowLinkModal(false)}>
                    <div className="modal-content w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-white mb-4">Add Link</h3>
                        <input
                            type="url"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            placeholder="https://example.com"
                            className="input-field mb-4"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && addLink()}
                        />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowLinkModal(false)} className="btn-secondary py-2 px-4">
                                Cancel
                            </button>
                            <button onClick={addLink} className="btn-primary py-2 px-4">
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
