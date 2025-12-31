/**
 * Asset Review Gallery - Development Mode Only
 *
 * Provides a visual review interface for all generated assets:
 * - Grid gallery of all assets organized by category
 * - Click to preview with modal (video player, sprite animator)
 * - Checkbox selection for batch approval
 * - Export/import approval JSON
 * - Stored preferences in localStorage
 */
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import { useCallback, useEffect, useMemo, useState } from 'react';
// Import manifests
import chapterPlatesManifest from '@/data/manifests/chapter-plates.json';
import cinematicsManifest from '@/data/manifests/cinematics.json';
import effectsManifest from '@/data/manifests/effects.json';
import enemiesManifest from '@/data/manifests/enemies.json';
import itemsManifest from '@/data/manifests/items.json';
import scenesManifest from '@/data/manifests/scenes.json';
import soundsManifest from '@/data/manifests/sounds.json';
import spritesManifest from '@/data/manifests/sprites.json';
// Storage keys
const APPROVAL_STORAGE_KEY = 'otterblade_asset_approvals';
const SELECTION_STORAGE_KEY = 'otterblade_asset_selection';
// Get base path for assets (handles GitHub Pages subdirectory deployment)
const BASE_PATH = import.meta.env.BASE_URL || '/';
// Combine all manifests
const ALL_MANIFESTS = [
    {
        ...spritesManifest,
        assets: spritesManifest.assets.map((a) => ({ ...a, category: 'sprites' })),
    },
    {
        ...enemiesManifest,
        assets: enemiesManifest.assets.map((a) => ({ ...a, category: 'enemies' })),
    },
    {
        ...cinematicsManifest,
        assets: cinematicsManifest.assets.map((a) => ({ ...a, category: 'cinematics' })),
    },
    {
        ...chapterPlatesManifest,
        assets: chapterPlatesManifest.assets.map((a) => ({ ...a, category: 'chapter-plates' })),
    },
    { ...scenesManifest, assets: scenesManifest.assets.map((a) => ({ ...a, category: 'scenes' })) },
    { ...itemsManifest, assets: itemsManifest.assets.map((a) => ({ ...a, category: 'items' })) },
    {
        ...effectsManifest,
        assets: effectsManifest.assets.map((a) => ({ ...a, category: 'effects' })),
    },
    { ...soundsManifest, assets: soundsManifest.assets.map((a) => ({ ...a, category: 'sounds' })) },
];
// Status color mapping
const STATUS_COLORS = {
    pending: 'default',
    generating: 'info',
    complete: 'success',
    needs_regeneration: 'warning',
    approved: 'primary',
    rejected: 'error',
};
function AssetCard({ asset, outputDir, selected, approved, onSelect, onPreview }) {
    const isVideo = asset.filename.endsWith('.mp4');
    const isAudio = asset.filename.endsWith('.mp3') || asset.filename.endsWith('.wav');
    const isSprite = asset.type === 'sprite_sheet' || asset.category === 'sprites';
    // Construct asset path with base path for GitHub Pages
    const assetPath = `${BASE_PATH}${outputDir}/${asset.filename}`.replace(/\/+/g, '/');
    return (React.createElement(Card, { sx: {
            position: 'relative',
            cursor: 'pointer',
            transition: 'all 0.2s',
            border: approved
                ? '2px solid #4caf50'
                : selected
                    ? '2px solid #2196f3'
                    : '2px solid transparent',
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4,
            },
        }, onClick: () => onPreview(asset, outputDir) },
        React.createElement(Box, { sx: { position: 'absolute', top: 8, left: 8, zIndex: 10 } },
            React.createElement(Checkbox, { checked: selected, onChange: (e) => {
                    e.stopPropagation();
                    onSelect(asset.id, e.target.checked);
                }, onClick: (e) => e.stopPropagation(), sx: { bgcolor: 'rgba(255,255,255,0.8)', borderRadius: 1 } })),
        approved && (React.createElement(Chip, { label: "\u2713 Approved", color: "success", size: "small", sx: { position: 'absolute', top: 8, right: 8, zIndex: 10 } })),
        isVideo ? (React.createElement(Box, { sx: {
                height: 160,
                bgcolor: '#1a1a2e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            } },
            React.createElement(Typography, { variant: "h3" }, "\uD83C\uDFAC"))) : isAudio ? (React.createElement(Box, { sx: {
                height: 160,
                bgcolor: '#2d4a3e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            } },
            React.createElement(Typography, { variant: "h3" }, "\uD83D\uDD0A"))) : (React.createElement(CardMedia, { component: "img", height: "160", image: assetPath, alt: asset.name, sx: { objectFit: 'cover' }, onError: (e) => {
                e.currentTarget.src =
                    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="160"><rect fill="%23333" width="200" height="160"/><text x="50%" y="50%" fill="%23666" text-anchor="middle" dy=".3em">Not Found</text></svg>';
            } })),
        isSprite && (React.createElement(Chip, { label: "Sprite Sheet", size: "small", sx: { position: 'absolute', bottom: 70, right: 8 } })),
        React.createElement(CardContent, { sx: { py: 1.5 } },
            React.createElement(Typography, { variant: "subtitle2", noWrap: true }, asset.name),
            React.createElement(Typography, { variant: "caption", color: "text.secondary", noWrap: true }, asset.filename),
            React.createElement(Box, { sx: { mt: 1 } },
                React.createElement(Chip, { label: asset.status, color: STATUS_COLORS[asset.status] || 'default', size: "small" })))));
}
function PreviewModal({ open, asset, outputDir, onClose }) {
    const [showAnimation, setShowAnimation] = useState(false);
    if (!asset)
        return null;
    const isVideo = asset.filename.endsWith('.mp4');
    const isAudio = asset.filename.endsWith('.mp3') || asset.filename.endsWith('.wav');
    const isSprite = asset.type === 'sprite_sheet' || asset.category === 'sprites';
    const assetPath = `${BASE_PATH}${outputDir}/${asset.filename}`.replace(/\/+/g, '/');
    return (React.createElement(Dialog, { open: open, onClose: onClose, maxWidth: "lg", fullWidth: true },
        React.createElement(DialogTitle, null,
            React.createElement(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                React.createElement(Typography, { variant: "h6" }, asset.name),
                React.createElement(IconButton, { onClick: onClose }, "\u2715"))),
        React.createElement(DialogContent, null,
            isVideo ? (React.createElement(Box, { sx: { width: '100%', aspectRatio: '16/9', bgcolor: '#000' } },
                React.createElement("video", { src: assetPath, controls: true, autoPlay: true, style: { width: '100%', height: '100%' } }))) : isAudio ? (React.createElement(Box, { sx: { p: 4, textAlign: 'center' } },
                React.createElement(Typography, { variant: "h4", sx: { mb: 3 } }, "\uD83D\uDD0A"),
                React.createElement("audio", { src: assetPath, controls: true, style: { width: '100%' } }))) : isSprite ? (React.createElement(Box, null,
                React.createElement(Box, { sx: { mb: 2, display: 'flex', justifyContent: 'center' } },
                    React.createElement(ToggleButtonGroup, { value: showAnimation ? 'animation' : 'frames', exclusive: true, onChange: (_, val) => val && setShowAnimation(val === 'animation') },
                        React.createElement(ToggleButton, { value: "frames" }, "Show Frames"),
                        React.createElement(ToggleButton, { value: "animation" }, "Show Animation"))),
                showAnimation ? (React.createElement(Box, { sx: { textAlign: 'center' } },
                    React.createElement(Typography, { color: "text.secondary", sx: { mb: 2 } }, "Animation preview (sprite sheet playback)"),
                    React.createElement(Box, { sx: {
                            width: 128,
                            height: 128,
                            mx: 'auto',
                            backgroundImage: `url(${assetPath})`,
                            backgroundSize: 'auto 100%',
                            animation: 'spritePlay 0.8s steps(8) infinite',
                        } }),
                    React.createElement("style", null, `
                  @keyframes spritePlay {
                    from { background-position: 0 0; }
                    to { background-position: -1024px 0; }
                  }
                `))) : (React.createElement(Box, { sx: { textAlign: 'center' } },
                    React.createElement("img", { src: assetPath, alt: asset.name, style: { maxWidth: '100%', height: 'auto' } }))))) : (React.createElement(Box, { sx: { textAlign: 'center' } },
                React.createElement("img", { src: assetPath, alt: asset.name, style: { maxWidth: '100%', maxHeight: '70vh', height: 'auto' } }))),
            React.createElement(Divider, { sx: { my: 2 } }),
            React.createElement(Typography, { variant: "subtitle2" }, "Details"),
            React.createElement(Typography, { variant: "body2", color: "text.secondary" },
                React.createElement("strong", null, "ID:"),
                " ",
                asset.id,
                React.createElement("br", null),
                React.createElement("strong", null, "Filename:"),
                " ",
                asset.filename,
                React.createElement("br", null),
                React.createElement("strong", null, "Status:"),
                " ",
                asset.status,
                React.createElement("br", null),
                React.createElement("strong", null, "Category:"),
                " ",
                asset.category),
            asset.prompt && (React.createElement(React.Fragment, null,
                React.createElement(Typography, { variant: "subtitle2", sx: { mt: 2 } }, "Prompt"),
                React.createElement(Box, { component: "pre", sx: {
                        p: 2,
                        bgcolor: 'grey.900',
                        borderRadius: 1,
                        overflow: 'auto',
                        fontSize: '0.75rem',
                        maxHeight: 200,
                    } }, JSON.stringify(asset.prompt, null, 2)))))));
}
// ============================================================================
// Main Asset Review Component
// ============================================================================
export default function AssetReview() {
    const [activeTab, setActiveTab] = useState(0);
    const [selectedAssets, setSelectedAssets] = useState(new Set());
    const [approvals, setApprovals] = useState({});
    const [previewAsset, setPreviewAsset] = useState(null);
    const [previewOutputDir, setPreviewOutputDir] = useState('');
    // Load saved state
    useEffect(() => {
        try {
            const savedApprovals = localStorage.getItem(APPROVAL_STORAGE_KEY);
            if (savedApprovals) {
                setApprovals(JSON.parse(savedApprovals));
            }
            const savedSelection = localStorage.getItem(SELECTION_STORAGE_KEY);
            if (savedSelection) {
                setSelectedAssets(new Set(JSON.parse(savedSelection)));
            }
        }
        catch (e) {
            console.error('Failed to load saved state:', e);
        }
    }, []);
    // Save approvals to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(APPROVAL_STORAGE_KEY, JSON.stringify(approvals));
        }
        catch {
            // Quota exceeded or localStorage unavailable - continue without persistence
        }
    }, [approvals]);
    // Save selection to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(SELECTION_STORAGE_KEY, JSON.stringify([...selectedAssets]));
        }
        catch {
            // Quota exceeded or localStorage unavailable - continue without persistence
        }
    }, [selectedAssets]);
    // Get current manifest
    const currentManifest = ALL_MANIFESTS[activeTab];
    const assets = currentManifest?.assets || [];
    // Selection handlers
    const handleSelect = useCallback((id, selected) => {
        setSelectedAssets((prev) => {
            const next = new Set(prev);
            if (selected) {
                next.add(id);
            }
            else {
                next.delete(id);
            }
            return next;
        });
    }, []);
    const handleSelectAll = useCallback(() => {
        setSelectedAssets((prev) => {
            const allIds = assets.map((a) => a.id);
            const allSelected = allIds.every((id) => prev.has(id));
            if (allSelected) {
                return new Set([...prev].filter((id) => !allIds.includes(id)));
            }
            return new Set([...prev, ...allIds]);
        });
    }, [assets]);
    // Approval handlers
    const handleApproveSelected = useCallback(() => {
        const now = new Date().toISOString();
        setApprovals((prev) => {
            const next = { ...prev };
            for (const id of selectedAssets) {
                next[id] = { approved: true, approvedAt: now };
            }
            return next;
        });
    }, [selectedAssets]);
    const handleRejectSelected = useCallback(() => {
        setApprovals((prev) => {
            const next = { ...prev };
            for (const id of selectedAssets) {
                next[id] = { approved: false };
            }
            return next;
        });
    }, [selectedAssets]);
    const handleClearApprovals = useCallback(() => {
        setApprovals({});
        setSelectedAssets(new Set());
    }, []);
    // Build approval export data
    const buildExportData = useCallback(() => {
        return {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            approvals: Object.entries(approvals)
                .filter(([_, v]) => v.approved)
                .map(([id, data]) => ({
                id,
                ...data,
            })),
        };
    }, [approvals]);
    // Export approval JSON (download file)
    const handleExportApprovals = useCallback(() => {
        const exportData = buildExportData();
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `otterblade-asset-approvals-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [buildExportData]);
    // Create GitHub PR with approvals - opens GitHub directly with content pre-filled
    const handleCreatePR = useCallback(() => {
        const exportData = buildExportData();
        const approvalCount = exportData.approvals.length;
        if (approvalCount === 0) {
            alert('No assets approved yet. Select and approve assets first.');
            return;
        }
        // GitHub repo info
        const repoOwner = 'jbdevprimary';
        const repoName = 'otterblade-odyssey';
        const filePath = 'client/src/data/approvals.json';
        // Create commit message
        const commitTitle = `chore(assets): approve ${approvalCount} asset${approvalCount > 1 ? 's' : ''}`;
        const commitDesc = `Approved assets:\n${exportData.approvals.map((a) => `- ${a.id}`).join('\n')}\n\nExported from Asset Review Gallery`;
        // Encode the file content for URL
        const fileContent = JSON.stringify(exportData, null, 2);
        // Use GitHub's new file URL which allows creating on a new branch (triggers PR flow)
        // Format: https://github.com/{owner}/{repo}/new/{branch}?filename={path}&value={content}
        const params = new URLSearchParams({
            filename: filePath,
            value: fileContent,
            message: commitTitle,
            description: commitDesc,
        });
        const githubUrl = `https://github.com/${repoOwner}/${repoName}/new/main?${params.toString()}`;
        // Open in new tab - user just needs to:
        // 1. Change branch name (GitHub prompts for new branch)
        // 2. Click "Propose changes" -> Creates PR automatically
        window.open(githubUrl, '_blank');
    }, [buildExportData]);
    // Import approval JSON
    const handleImportApprovals = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files?.[0];
            if (!file)
                return;
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                if (data.approvals && Array.isArray(data.approvals)) {
                    const newApprovals = {};
                    for (const item of data.approvals) {
                        if (item.id) {
                            newApprovals[item.id] = {
                                approved: true,
                                approvedAt: item.approvedAt,
                                notes: item.notes,
                            };
                        }
                    }
                    setApprovals(newApprovals);
                    alert(`Imported ${Object.keys(newApprovals).length} approvals`);
                }
            }
            catch (err) {
                alert(`Failed to import approvals: ${err.message}`);
            }
        };
        input.click();
    }, []);
    // Preview handler
    const handlePreview = useCallback((asset, outputDir) => {
        setPreviewAsset(asset);
        setPreviewOutputDir(outputDir);
    }, []);
    // Stats
    const stats = useMemo(() => {
        const total = assets.length;
        const approved = assets.filter((a) => approvals[a.id]?.approved).length;
        const pending = assets.filter((a) => a.status === 'pending').length;
        const needsRegen = assets.filter((a) => a.status === 'needs_regeneration').length;
        return { total, approved, pending, needsRegen };
    }, [assets, approvals]);
    return (React.createElement(Box, { sx: { minHeight: '100vh', bgcolor: 'background.default', py: 4 } },
        React.createElement(Container, { maxWidth: "xl" },
            React.createElement(Box, { sx: { mb: 4 } },
                React.createElement(Typography, { variant: "h3", gutterBottom: true }, "\uD83E\uDDA6 Asset Review Gallery"),
                React.createElement(Typography, { variant: "body1", color: "text.secondary", sx: { mb: 2 } }, "Review, approve, and manage generated assets for Otterblade Odyssey."),
                React.createElement(Box, { sx: {
                        p: 2,
                        bgcolor: 'rgba(212, 168, 75, 0.1)',
                        border: '1px solid rgba(212, 168, 75, 0.3)',
                        borderRadius: 2,
                        mb: 2,
                    } },
                    React.createElement(Typography, { variant: "subtitle2", sx: { color: '#d4a84b', mb: 1 } }, "\uD83D\uDCCB How Asset Approval Works"),
                    React.createElement(Typography, { variant: "body2", color: "text.secondary", component: "div" },
                        React.createElement("ol", { style: { margin: 0, paddingLeft: '1.2rem' } },
                            React.createElement("li", null,
                                React.createElement("strong", null, "Select"),
                                " assets using checkboxes (or \"Select All\")"),
                            React.createElement("li", null,
                                React.createElement("strong", null, "Approve"),
                                " selected assets with the green button"),
                            React.createElement("li", null,
                                React.createElement("strong", null, "Create PR"),
                                " \u2192 Opens GitHub with your approvals pre-filled"),
                            React.createElement("li", null,
                                React.createElement("strong", null, "Commit"),
                                " on a new branch \u2192 GitHub creates the PR automatically"),
                            React.createElement("li", null,
                                React.createElement("strong", null, "Merge"),
                                " \u2192 Approved assets become idempotent (won't regenerate)"))))),
            React.createElement(Tabs, { value: activeTab, onChange: (_, v) => setActiveTab(v), sx: { mb: 3, borderBottom: 1, borderColor: 'divider' } }, ALL_MANIFESTS.map((m) => (React.createElement(Tab, { key: m.category, label: `${m.category} (${m.assets.length})` })))),
            React.createElement(Box, { sx: { mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' } },
                React.createElement(Chip, { label: `Total: ${stats.total}` }),
                React.createElement(Chip, { label: `Approved: ${stats.approved}`, color: "success" }),
                React.createElement(Chip, { label: `Pending: ${stats.pending}`, color: "default" }),
                React.createElement(Chip, { label: `Needs Regen: ${stats.needsRegen}`, color: "warning" }),
                React.createElement(Chip, { label: `Selected: ${selectedAssets.size}`, color: "primary" })),
            Object.values(approvals).some((a) => a.approved) && (React.createElement(Box, { sx: {
                    mb: 3,
                    p: 2,
                    bgcolor: 'rgba(74, 103, 65, 0.2)',
                    border: '2px solid #4a6741',
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    flexWrap: 'wrap',
                } },
                React.createElement(Typography, { variant: "body1", sx: { flex: 1 } },
                    React.createElement("strong", null, Object.values(approvals).filter((a) => a.approved).length),
                    " assets approved and ready to commit"),
                React.createElement(Button, { variant: "contained", size: "large", onClick: handleCreatePR, sx: {
                        bgcolor: '#4a6741',
                        '&:hover': { bgcolor: '#6b8a5f' },
                        px: 4,
                    } }, "\uD83D\uDE80 Create PR on GitHub"))),
            React.createElement(Box, { sx: { mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' } },
                React.createElement(Button, { variant: "outlined", onClick: handleSelectAll }, "Select All / None"),
                React.createElement(Button, { variant: "contained", color: "success", onClick: handleApproveSelected, disabled: selectedAssets.size === 0 },
                    "\u2713 Approve Selected (",
                    selectedAssets.size,
                    ")"),
                React.createElement(Button, { variant: "outlined", color: "error", onClick: handleRejectSelected, disabled: selectedAssets.size === 0 }, "\u2715 Reject Selected"),
                React.createElement(Divider, { orientation: "vertical", flexItem: true }),
                React.createElement(Button, { variant: "outlined", size: "small", onClick: handleExportApprovals }, "\uD83D\uDCE5 Download JSON"),
                React.createElement(Button, { variant: "outlined", size: "small", onClick: handleImportApprovals }, "\uD83D\uDCE4 Upload JSON"),
                React.createElement(Button, { variant: "text", size: "small", color: "warning", onClick: handleClearApprovals }, "Clear All")),
            React.createElement(Box, { sx: {
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: 'repeat(1, 1fr)',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(3, 1fr)',
                        lg: 'repeat(4, 1fr)',
                        xl: 'repeat(5, 1fr)',
                    },
                    gap: 3,
                } }, assets.map((asset) => (React.createElement(AssetCard, { key: asset.id, asset: asset, outputDir: currentManifest.outputDir, selected: selectedAssets.has(asset.id), approved: approvals[asset.id]?.approved || false, onSelect: handleSelect, onPreview: handlePreview })))),
            assets.length === 0 && (React.createElement(Box, { sx: { textAlign: 'center', py: 8 } },
                React.createElement(Typography, { variant: "h5", color: "text.secondary" }, "No assets in this category"))),
            React.createElement(PreviewModal, { open: !!previewAsset, asset: previewAsset, outputDir: previewOutputDir, onClose: () => setPreviewAsset(null) }))));
}
