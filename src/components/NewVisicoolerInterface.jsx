import React, { useState } from 'react';
import { Box, Paper, Typography, FormControlLabel, Switch, InputLabel } from '@mui/material';



export const Interface = ({ onLEDToggle, ledOn, glowColor, onGlowColorChange, fridgeColor, onFridgeColorChange, handleColor, onHandleColorChange, onInsideStripTextureUpload, onSidePanelLeftTextureUpload, onSidePanelRightTextureUpload }) => {
  const [pendingImage, setPendingImage] = useState(null);
  const [pendingSidePanelLeft, setPendingSidePanelLeft] = useState(null);
  const [pendingSidePanelRight, setPendingSidePanelRight] = useState(null);
  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6">New Visicooler</Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          Simple viewer: uses same HDR environment.
        </Typography>

        {/* Toggle Switch */}
        <FormControlLabel
          control={
            <Switch
              checked={ledOn}
              onChange={(e) => onLEDToggle?.(e.target.checked)}
              color="primary"
            />
          }
          label={ledOn ? 'LED Light ON' : 'LED Light OFF'}
          sx={{ mt: 2 }}
        />

        {/* Glow Material Color Picker */}
        <Box sx={{ mt: 3 }}>
          <InputLabel shrink htmlFor="glow-color-picker">Glow Material Color</InputLabel>
          <input
            id="glow-color-picker"
            type="color"
            value={glowColor}
            onChange={e => onGlowColorChange?.(e.target.value)}
            style={{ width: 40, height: 40, border: 'none', background: 'none', cursor: 'pointer' }}
          />
        </Box>

        {/* FridgeColor Material Color Picker */}
        <Box sx={{ mt: 3 }}>
          <InputLabel shrink htmlFor="fridge-color-picker">Fridge Body Color</InputLabel>
          <input
            id="fridge-color-picker"
            type="color"
            value={fridgeColor || '#ffffff'}
            onChange={e => onFridgeColorChange?.(e.target.value)}
            style={{ width: 40, height: 40, border: 'none', background: 'none', cursor: 'pointer' }}
          />
        </Box>

        {/* HandleColor Material Color Picker */}
        <Box sx={{ mt: 3 }}>
          <InputLabel shrink htmlFor="handle-color-picker">Handle Color</InputLabel>
          <input
            id="handle-color-picker"
            type="color"
            value={handleColor || '#ffffff'}
            onChange={e => onHandleColorChange?.(e.target.value)}
            style={{ width: 40, height: 40, border: 'none', background: 'none', cursor: 'pointer' }}
          />
        </Box>

        {/* InsideStrip Texture Upload with Apply Button */}
        <Box sx={{ mt: 3 }}>
          <InputLabel shrink htmlFor="inside-strip-upload">InsideStrip Texture</InputLabel>
          <input
            id="inside-strip-upload"
            type="file"
            accept="image/*"
            onChange={e => {
              const file = e.target.files && e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                  setPendingImage(ev.target.result);
                };
                reader.readAsDataURL(file);
              }
            }}
            style={{ marginTop: 8 }}
          />
          <button
            style={{ marginLeft: 12, marginTop: 8, padding: '6px 16px', borderRadius: 4, border: 'none', background: '#1976d2', color: 'white', cursor: 'pointer', fontWeight: 600 }}
            disabled={!pendingImage}
            onClick={() => {
              if (pendingImage && onInsideStripTextureUpload) onInsideStripTextureUpload(pendingImage);
            }}
          >
            Apply
          </button>
        </Box>
        {/* SidepannelLeft Texture Upload with Apply Button */}
        <Box sx={{ mt: 3 }}>
          <InputLabel shrink htmlFor="sidepanel-left-upload">SidepannelLeft Texture</InputLabel>
          <input
            id="sidepanel-left-upload"
            type="file"
            accept="image/*"
            onChange={e => {
              const file = e.target.files && e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                  setPendingSidePanelLeft(ev.target.result);
                };
                reader.readAsDataURL(file);
              }
            }}
            style={{ marginTop: 8 }}
          />
          <button
            style={{ marginLeft: 12, marginTop: 8, padding: '6px 16px', borderRadius: 4, border: 'none', background: '#1976d2', color: 'white', cursor: 'pointer', fontWeight: 600 }}
            disabled={!pendingSidePanelLeft}
            onClick={() => {
              if (pendingSidePanelLeft && onSidePanelLeftTextureUpload) onSidePanelLeftTextureUpload(pendingSidePanelLeft);
            }}
          >
            Apply
          </button>
        </Box>
        {/* SidepannelRight Texture Upload with Apply Button */}
        <Box sx={{ mt: 3 }}>
          <InputLabel shrink htmlFor="sidepanel-right-upload">SidepannelRight Texture</InputLabel>
          <input
            id="sidepanel-right-upload"
            type="file"
            accept="image/*"
            onChange={e => {
              const file = e.target.files && e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                  setPendingSidePanelRight(ev.target.result);
                };
                reader.readAsDataURL(file);
              }
            }}
            style={{ marginTop: 8 }}
          />
          <button
            style={{ marginLeft: 12, marginTop: 8, padding: '6px 16px', borderRadius: 4, border: 'none', background: '#1976d2', color: 'white', cursor: 'pointer', fontWeight: 600 }}
            disabled={!pendingSidePanelRight}
            onClick={() => {
              if (pendingSidePanelRight && onSidePanelRightTextureUpload) onSidePanelRightTextureUpload(pendingSidePanelRight);
            }}
          >
            Apply
          </button>
        </Box>
      </Paper>
    </Box>
  );
};
