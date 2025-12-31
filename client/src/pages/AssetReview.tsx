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
import cinematicsManifest from '@/data/manifests/cinematics.json';
import scenesManifest from '@/data/manifests/scenes.json';
import soundsManifest from '@/data/manifests/sounds.json';
import spritesManifest from '@/data/manifests/sprites.json';
import enemiesManifest from '@/data/manifests/enemies.json';

// Types
interface AssetItem {
  id: string;
  name: string;
  filename: string;
  status: string;
  category: string;
  type?: string;
  config?: Record<string, unknown>;
  prompt?: Record<string, unknown>;
}

interface ApprovalState {
  [assetId: string]: {
    approved: boolean;
    approvedAt?: string;
    notes?: string;
  };
}

interface ManifestData {
  category: string;
  outputDir: string;
  assets: AssetItem[];
}

// Storage keys
const APPROVAL_STORAGE_KEY = 'otterblade_asset_approvals';
const SELECTION_STORAGE_KEY = 'otterblade_asset_selection';

// Get base path for assets (handles GitHub Pages subdirectory deployment)
const BASE_PATH = import.meta.env.BASE_URL || '/';

// Combine all manifests
const ALL_MANIFESTS: ManifestData[] = [
  { ...spritesManifest, assets: spritesManifest.assets.map(a => ({ ...a, category: 'sprites' })) },
  { ...enemiesManifest, assets: enemiesManifest.assets.map(a => ({ ...a, category: 'enemies' })) },
  { ...cinematicsManifest, assets: cinematicsManifest.assets.map(a => ({ ...a, category: 'cinematics' })) },
  { ...scenesManifest, assets: scenesManifest.assets.map(a => ({ ...a, category: 'scenes' })) },
  { ...soundsManifest, assets: soundsManifest.assets.map(a => ({ ...a, category: 'sounds' })) },
] as ManifestData[];

// Status color mapping
const STATUS_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  pending: 'default',
  generating: 'info',
  complete: 'success',
  needs_regeneration: 'warning',
  approved: 'primary',
  rejected: 'error',
};

// ============================================================================
// Asset Card Component
// ============================================================================

interface AssetCardProps {
  asset: AssetItem;
  outputDir: string;
  selected: boolean;
  approved: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onPreview: (asset: AssetItem, outputDir: string) => void;
}

function AssetCard({ asset, outputDir, selected, approved, onSelect, onPreview }: AssetCardProps) {
  const isVideo = asset.filename.endsWith('.mp4');
  const isAudio = asset.filename.endsWith('.mp3') || asset.filename.endsWith('.wav');
  const isSprite = asset.type === 'sprite_sheet' || asset.category === 'sprites';

  // Construct asset path with base path for GitHub Pages
  const assetPath = `${BASE_PATH}${outputDir}/${asset.filename}`.replace(/\/+/g, '/');

  return (
    <Card
      sx={{
        position: 'relative',
        cursor: 'pointer',
        transition: 'all 0.2s',
        border: approved ? '2px solid #4caf50' : selected ? '2px solid #2196f3' : '2px solid transparent',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
      onClick={() => onPreview(asset, outputDir)}
    >
      {/* Selection checkbox */}
      <Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 10 }}>
        <Checkbox
          checked={selected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect(asset.id, e.target.checked);
          }}
          onClick={(e) => e.stopPropagation()}
          sx={{ bgcolor: 'rgba(255,255,255,0.8)', borderRadius: 1 }}
        />
      </Box>

      {/* Approval badge */}
      {approved && (
        <Chip
          label="✓ Approved"
          color="success"
          size="small"
          sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}
        />
      )}

      {/* Thumbnail */}
      {isVideo ? (
        <Box sx={{ height: 160, bgcolor: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="h3">🎬</Typography>
        </Box>
      ) : isAudio ? (
        <Box sx={{ height: 160, bgcolor: '#2d4a3e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="h3">🔊</Typography>
        </Box>
      ) : (
        <CardMedia
          component="img"
          height="160"
          image={assetPath}
          alt={asset.name}
          sx={{ objectFit: 'cover' }}
          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
            e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="160"><rect fill="%23333" width="200" height="160"/><text x="50%" y="50%" fill="%23666" text-anchor="middle" dy=".3em">Not Found</text></svg>';
          }}
        />
      )}

      {/* Sprite sheet annotation */}
      {isSprite && (
        <Chip
          label="Sprite Sheet"
          size="small"
          sx={{ position: 'absolute', bottom: 70, right: 8 }}
        />
      )}

      <CardContent sx={{ py: 1.5 }}>
        <Typography variant="subtitle2" noWrap>{asset.name}</Typography>
        <Typography variant="caption" color="text.secondary" noWrap>{asset.filename}</Typography>
        <Box sx={{ mt: 1 }}>
          <Chip
            label={asset.status}
            color={STATUS_COLORS[asset.status] || 'default'}
            size="small"
          />
        </Box>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Preview Modal Component
// ============================================================================

interface PreviewModalProps {
  open: boolean;
  asset: AssetItem | null;
  outputDir: string;
  onClose: () => void;
}

function PreviewModal({ open, asset, outputDir, onClose }: PreviewModalProps) {
  const [showAnimation, setShowAnimation] = useState(false);

  if (!asset) return null;

  const isVideo = asset.filename.endsWith('.mp4');
  const isAudio = asset.filename.endsWith('.mp3') || asset.filename.endsWith('.wav');
  const isSprite = asset.type === 'sprite_sheet' || asset.category === 'sprites';
  const assetPath = `${BASE_PATH}${outputDir}/${asset.filename}`.replace(/\/+/g, '/');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{asset.name}</Typography>
          <IconButton onClick={onClose}>✕</IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {isVideo ? (
          <Box sx={{ width: '100%', aspectRatio: '16/9', bgcolor: '#000' }}>
            {/* biome-ignore lint/a11y/useMediaCaption: Asset review preview */}
            <video
              src={assetPath}
              controls
              autoPlay
              style={{ width: '100%', height: '100%' }}
            />
          </Box>
        ) : isAudio ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ mb: 3 }}>🔊</Typography>
            {/* biome-ignore lint/a11y/useMediaCaption: Asset review audio preview */}
            <audio src={assetPath} controls style={{ width: '100%' }} />
          </Box>
        ) : isSprite ? (
          <Box>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
              <ToggleButtonGroup
                value={showAnimation ? 'animation' : 'frames'}
                exclusive
                onChange={(_, val) => val && setShowAnimation(val === 'animation')}
              >
                <ToggleButton value="frames">Show Frames</ToggleButton>
                <ToggleButton value="animation">Show Animation</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            {showAnimation ? (
              <Box sx={{ textAlign: 'center' }}>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  Animation preview (sprite sheet playback)
                </Typography>
                <Box
                  sx={{
                    width: 128,
                    height: 128,
                    mx: 'auto',
                    backgroundImage: `url(${assetPath})`,
                    backgroundSize: 'auto 100%',
                    animation: 'spritePlay 0.8s steps(8) infinite',
                  }}
                />
                <style>{`
                  @keyframes spritePlay {
                    from { background-position: 0 0; }
                    to { background-position: -1024px 0; }
                  }
                `}</style>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center' }}>
                <img
                  src={assetPath}
                  alt={asset.name}
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center' }}>
            <img
              src={assetPath}
              alt={asset.name}
              style={{ maxWidth: '100%', maxHeight: '70vh', height: 'auto' }}
            />
          </Box>
        )}

        {/* Asset details */}
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2">Details</Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>ID:</strong> {asset.id}<br />
          <strong>Filename:</strong> {asset.filename}<br />
          <strong>Status:</strong> {asset.status}<br />
          <strong>Category:</strong> {asset.category}
        </Typography>

        {asset.prompt && (
          <>
            <Typography variant="subtitle2" sx={{ mt: 2 }}>Prompt</Typography>
            <Box
              component="pre"
              sx={{
                p: 2,
                bgcolor: 'grey.900',
                borderRadius: 1,
                overflow: 'auto',
                fontSize: '0.75rem',
                maxHeight: 200,
              }}
            >
              {JSON.stringify(asset.prompt, null, 2)}
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Main Asset Review Component
// ============================================================================

export default function AssetReview() {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [approvals, setApprovals] = useState<ApprovalState>({});
  const [previewAsset, setPreviewAsset] = useState<AssetItem | null>(null);
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
    } catch (e) {
      console.error('Failed to load saved state:', e);
    }
  }, []);

  // Save approvals to localStorage
  useEffect(() => {
    localStorage.setItem(APPROVAL_STORAGE_KEY, JSON.stringify(approvals));
  }, [approvals]);

  // Save selection to localStorage
  useEffect(() => {
    localStorage.setItem(SELECTION_STORAGE_KEY, JSON.stringify([...selectedAssets]));
  }, [selectedAssets]);

  // Get current manifest
  const currentManifest = ALL_MANIFESTS[activeTab];
  const assets = currentManifest?.assets || [];

  // Selection handlers
  const handleSelect = useCallback((id: string, selected: boolean) => {
    setSelectedAssets((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
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

  // Export approval JSON
  const handleExportApprovals = useCallback(() => {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      approvals: Object.entries(approvals)
        .filter(([_, v]) => v.approved)
        .map(([id, data]) => ({
          id,
          ...data,
        })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `otterblade-asset-approvals-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [approvals]);

  // Import approval JSON
  const handleImportApprovals = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (data.approvals && Array.isArray(data.approvals)) {
          const newApprovals: ApprovalState = {};
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
      } catch (err) {
        alert(`Failed to import approvals: ${(err as Error).message}`);
      }
    };
    input.click();
  }, []);

  // Preview handler
  const handlePreview = useCallback((asset: AssetItem, outputDir: string) => {
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

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" gutterBottom>
            🦦 Asset Review Gallery
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Review, approve, and manage generated assets for Otterblade Odyssey.
            Select assets and approve them for production use.
          </Typography>
        </Box>

        {/* Category Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          {ALL_MANIFESTS.map((m) => (
            <Tab key={m.category} label={`${m.category} (${m.assets.length})`} />
          ))}
        </Tabs>

        {/* Stats Bar */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Chip label={`Total: ${stats.total}`} />
          <Chip label={`Approved: ${stats.approved}`} color="success" />
          <Chip label={`Pending: ${stats.pending}`} color="default" />
          <Chip label={`Needs Regen: ${stats.needsRegen}`} color="warning" />
          <Chip label={`Selected: ${selectedAssets.size}`} color="primary" />
        </Box>

        {/* Action Bar */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button variant="outlined" onClick={handleSelectAll}>
            Select All / None
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleApproveSelected}
            disabled={selectedAssets.size === 0}
          >
            ✓ Approve Selected ({selectedAssets.size})
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={handleRejectSelected}
            disabled={selectedAssets.size === 0}
          >
            ✕ Reject Selected
          </Button>
          <Divider orientation="vertical" flexItem />
          <Button variant="outlined" onClick={handleExportApprovals}>
            📥 Export Approvals
          </Button>
          <Button variant="outlined" onClick={handleImportApprovals}>
            📤 Import Approvals
          </Button>
          <Button variant="text" color="warning" onClick={handleClearApprovals}>
            Clear All
          </Button>
        </Box>

        {/* Asset Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)',
              xl: 'repeat(5, 1fr)',
            },
            gap: 3,
          }}
        >
          {assets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              outputDir={currentManifest.outputDir}
              selected={selectedAssets.has(asset.id)}
              approved={approvals[asset.id]?.approved || false}
              onSelect={handleSelect}
              onPreview={handlePreview}
            />
          ))}
        </Box>

        {assets.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h5" color="text.secondary">
              No assets in this category
            </Typography>
          </Box>
        )}

        {/* Preview Modal */}
        <PreviewModal
          open={!!previewAsset}
          asset={previewAsset}
          outputDir={previewOutputDir}
          onClose={() => setPreviewAsset(null)}
        />
      </Container>
    </Box>
  );
}
