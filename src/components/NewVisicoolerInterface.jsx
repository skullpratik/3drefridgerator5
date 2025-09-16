
import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Card,
  CardContent,
  Grid,
  Popover,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { styled } from '@mui/material/styles';
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CloseIcon from "@mui/icons-material/Close";
import PaletteIcon from "@mui/icons-material/Palette";
import ImageIcon from "@mui/icons-material/Image";
import { SketchPicker } from 'react-color';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    boxShadow: theme.shadows[4],
  }
}));

const SmallButton = styled(Button)(({ theme }) => ({
  fontSize: '0.7rem',
  padding: '4px 8px',
  minWidth: 'auto'
}));

const ColorButton = styled(Button)(({ theme, backgroundcolor }) => ({
  backgroundColor: backgroundcolor || '#f0f0f0',
  color: backgroundcolor ? '#fff' : '#000',
  border: backgroundcolor ? 'none' : '1px dashed #ccc',
  width: '100%',
  height: '30px',
  minWidth: 'auto',
  fontSize: '0.75rem',
  '&:hover': {
    backgroundColor: backgroundcolor || '#e0e0e0',
  }
}));

export const Interface = ({ onLEDToggle, ledOn, glowColor, onGlowColorChange, fridgeColor, onFridgeColorChange, handleColor, onHandleColorChange, onInsideStripTextureUpload, onSidePanelLeftTextureUpload, onSidePanelRightTextureUpload }) => {
  // Color pickers
  const [colorPickerOpen, setColorPickerOpen] = useState({ glow: false, fridge: false, handle: false });
  const [colorPickerAnchor, setColorPickerAnchor] = useState({ glow: null, fridge: null, handle: null });

  // Image uploads
  const [pendingImage, setPendingImage] = useState(null);
  const [pendingSidePanelLeft, setPendingSidePanelLeft] = useState(null);
  const [pendingSidePanelRight, setPendingSidePanelRight] = useState(null);

  // Handlers for color pickers
  const handleColorPickerOpen = (type, event) => {
    setColorPickerOpen({ ...colorPickerOpen, [type]: true });
    setColorPickerAnchor({ ...colorPickerAnchor, [type]: event.currentTarget });
  };
  const handleColorPickerClose = (type) => {
    setColorPickerOpen({ ...colorPickerOpen, [type]: false });
    setColorPickerAnchor({ ...colorPickerAnchor, [type]: null });
  };

  return (
    <Box sx={{ p: 1.5, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexShrink: 0 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
          New Visicooler Customization
        </Typography>
        <FormControlLabel control={<Switch size="small" checked={ledOn} onChange={e => onLEDToggle?.(e.target.checked)} />} label={<Typography sx={{ fontSize: '0.8rem' }}>LED</Typography>} />
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-track': { background: '#f1f1f1' }, '&::-webkit-scrollbar-thumb': { background: '#c1c1c1', borderRadius: '4px' }, '&::-webkit-scrollbar-thumb:hover': { background: '#a1a1a1' } }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', fontSize: '0.75rem' }}><ImageIcon sx={{ mr: 0.5, fontSize: '0.9rem' }} /> Image Customization</Typography>
          <Grid container spacing={1}>
            {/* All three upload widgets in a single row with image preview */}
            <Grid item xs={4}>
              <StyledCard variant="outlined">
                <CardContent sx={{ p: 1, flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', fontSize: '0.75rem' }}>
                    InsideStrip Texture
                  </Typography>
                  {pendingImage ? (
                    <Box sx={{ position: 'relative', mb: 1, width: '100%' }}>
                      <Box component="img" src={pendingImage} sx={{ width: '100%', height: 60, objectFit: 'cover', borderRadius: 0.5, border: '1px solid #e0e0e0' }} alt="InsideStrip preview" />
                      <IconButton size="small" onClick={() => { setPendingImage(null); if (onInsideStripTextureUpload) onInsideStripTextureUpload(null); }} sx={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', '&:hover': { backgroundColor: 'rgba(0,0,0,0.9)' }, width: 20, height: 20 }}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ) : (
                    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <SmallButton variant="outlined" component="label" fullWidth startIcon={<CloudUploadIcon sx={{ fontSize: '0.9rem' }} />} sx={{ backgroundColor: "#f7f9fc", border: "1px dashed #ccc", "&:hover": { border: "1px dashed #007bff", backgroundColor: "#e3f2fd" }, borderRadius: 0.5, py: 1 }}>
                        Upload
                        <input type="file" hidden accept="image/*" onChange={e => { const file = e.target.files && e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => { setPendingImage(ev.target.result); }; reader.readAsDataURL(file); }} />
                      </SmallButton>
                    </Box>
                  )}
                  <SmallButton
                    variant="contained"
                    disabled={!pendingImage}
                    onClick={() => {
                      if (pendingImage && onInsideStripTextureUpload) onInsideStripTextureUpload(pendingImage);
                    }}
                    sx={{ mt: 1 }}
                  >Apply</SmallButton>
                </CardContent>
              </StyledCard>
            </Grid>
            <Grid item xs={4}>
              <StyledCard variant="outlined">
                <CardContent sx={{ p: 1, flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', fontSize: '0.75rem' }}>
                    SidepannelLeft Texture
                  </Typography>
                  {pendingSidePanelLeft ? (
                    <Box sx={{ position: 'relative', mb: 1, width: '100%' }}>
                      <Box component="img" src={pendingSidePanelLeft} sx={{ width: '100%', height: 60, objectFit: 'cover', borderRadius: 0.5, border: '1px solid #e0e0e0' }} alt="SidepannelLeft preview" />
                      <IconButton size="small" onClick={() => { setPendingSidePanelLeft(null); if (onSidePanelLeftTextureUpload) onSidePanelLeftTextureUpload(null); }} sx={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', '&:hover': { backgroundColor: 'rgba(0,0,0,0.9)' }, width: 20, height: 20 }}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ) : (
                    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <SmallButton variant="outlined" component="label" fullWidth startIcon={<CloudUploadIcon sx={{ fontSize: '0.9rem' }} />} sx={{ backgroundColor: "#f7f9fc", border: "1px dashed #ccc", "&:hover": { border: "1px dashed #007bff", backgroundColor: "#e3f2fd" }, borderRadius: 0.5, py: 1 }}>
                        Upload
                        <input type="file" hidden accept="image/*" onChange={e => { const file = e.target.files && e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => { setPendingSidePanelLeft(ev.target.result); }; reader.readAsDataURL(file); }} />
                      </SmallButton>
                    </Box>
                  )}
                  <SmallButton
                    variant="contained"
                    disabled={!pendingSidePanelLeft}
                    onClick={() => {
                      if (pendingSidePanelLeft && onSidePanelLeftTextureUpload) onSidePanelLeftTextureUpload(pendingSidePanelLeft);
                    }}
                    sx={{ mt: 1 }}
                  >Apply</SmallButton>
                </CardContent>
              </StyledCard>
            </Grid>
            <Grid item xs={4}>
              <StyledCard variant="outlined">
                <CardContent sx={{ p: 1, flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', fontSize: '0.75rem' }}>
                    SidepannelRight Texture
                  </Typography>
                  {pendingSidePanelRight ? (
                    <Box sx={{ position: 'relative', mb: 1, width: '100%' }}>
                      <Box component="img" src={pendingSidePanelRight} sx={{ width: '100%', height: 60, objectFit: 'cover', borderRadius: 0.5, border: '1px solid #e0e0e0' }} alt="SidepannelRight preview" />
                      <IconButton size="small" onClick={() => { setPendingSidePanelRight(null); if (onSidePanelRightTextureUpload) onSidePanelRightTextureUpload(null); }} sx={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', '&:hover': { backgroundColor: 'rgba(0,0,0,0.9)' }, width: 20, height: 20 }}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ) : (
                    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <SmallButton variant="outlined" component="label" fullWidth startIcon={<CloudUploadIcon sx={{ fontSize: '0.9rem' }} />} sx={{ backgroundColor: "#f7f9fc", border: "1px dashed #ccc", "&:hover": { border: "1px dashed #007bff", backgroundColor: "#e3f2fd" }, borderRadius: 0.5, py: 1 }}>
                        Upload
                        <input type="file" hidden accept="image/*" onChange={e => { const file = e.target.files && e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => { setPendingSidePanelRight(ev.target.result); }; reader.readAsDataURL(file); }} />
                      </SmallButton>
                    </Box>
                  )}
                  <SmallButton
                    variant="contained"
                    disabled={!pendingSidePanelRight}
                    onClick={() => {
                      if (pendingSidePanelRight && onSidePanelRightTextureUpload) onSidePanelRightTextureUpload(pendingSidePanelRight);
                    }}
                    sx={{ mt: 1 }}
                  >Apply</SmallButton>
                </CardContent>
              </StyledCard>
            </Grid>
          </Grid>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', fontSize: '0.75rem' }}><PaletteIcon sx={{ mr: 0.5, fontSize: '0.9rem' }} /> Color Customization</Typography>
          <Grid container spacing={1}>
            <Grid item xs={4}>
              <StyledCard variant="outlined">
                <CardContent sx={{ p: 1, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', fontSize: '0.75rem' }}>
                    Glow Material Color
                  </Typography>
                  <ColorButton backgroundcolor={glowColor} onClick={e => handleColorPickerOpen('glow', e)}>
                    {glowColor ? 'Change Color' : 'Select Color'}
                  </ColorButton>
                  <Popover open={colorPickerOpen.glow} anchorEl={colorPickerAnchor.glow} onClose={() => handleColorPickerClose('glow')} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }}>
                    <Box sx={{ p: 1 }}>
                      <SketchPicker color={glowColor || '#fff'} onChange={color => onGlowColorChange?.(color.hex)} />
                    </Box>
                  </Popover>
                </CardContent>
              </StyledCard>
            </Grid>
            <Grid item xs={4}>
              <StyledCard variant="outlined">
                <CardContent sx={{ p: 1, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', fontSize: '0.75rem' }}>
                    Fridge Body Color
                  </Typography>
                  <ColorButton backgroundcolor={fridgeColor} onClick={e => handleColorPickerOpen('fridge', e)}>
                    {fridgeColor ? 'Change Color' : 'Select Color'}
                  </ColorButton>
                  <Popover open={colorPickerOpen.fridge} anchorEl={colorPickerAnchor.fridge} onClose={() => handleColorPickerClose('fridge')} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }}>
                    <Box sx={{ p: 1 }}>
                      <SketchPicker color={fridgeColor || '#fff'} onChange={color => onFridgeColorChange?.(color.hex)} />
                    </Box>
                  </Popover>
                </CardContent>
              </StyledCard>
            </Grid>
            <Grid item xs={4}>
              <StyledCard variant="outlined">
                <CardContent sx={{ p: 1, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', fontSize: '0.75rem' }}>
                    Handle Color
                  </Typography>
                  <ColorButton backgroundcolor={handleColor} onClick={e => handleColorPickerOpen('handle', e)}>
                    {handleColor ? 'Change Color' : 'Select Color'}
                  </ColorButton>
                  <Popover open={colorPickerOpen.handle} anchorEl={colorPickerAnchor.handle} onClose={() => handleColorPickerClose('handle')} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }}>
                    <Box sx={{ p: 1 }}>
                      <SketchPicker color={handleColor || '#fff'} onChange={color => onHandleColorChange?.(color.hex)} />
                    </Box>
                  </Popover>
                </CardContent>
              </StyledCard>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
};
