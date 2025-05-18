import React, { useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { 
  Box, 
  Typography,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ToggleButtonGroup,
  ToggleButton,
  Paper
} from '@mui/material';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignJustifyIcon from '@mui/icons-material/FormatAlignJustify';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';

const ReadabilityTools = () => {
  const { state, dispatch } = useContext(AppContext);
  const { readingPreferences } = state;
  
  // For text-to-speech
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const [speechSynthesis, setSpeechSynthesis] = React.useState(null);
  
  React.useEffect(() => {
    // Initialize speech synthesis
    if (window.speechSynthesis) {
      setSpeechSynthesis(window.speechSynthesis);
    }
  }, []);
  
  const handleFontSizeChange = (event, newValue) => {
    dispatch({
      type: 'UPDATE_READING_PREFERENCES',
      payload: { fontSize: newValue }
    });
  };
  
  const handleLineHeightChange = (event, newValue) => {
    dispatch({
      type: 'UPDATE_READING_PREFERENCES',
      payload: { lineHeight: newValue }
    });
  };
  
  const handleFontFamilyChange = (event) => {
    dispatch({
      type: 'UPDATE_READING_PREFERENCES',
      payload: { fontFamily: event.target.value }
    });
  };
  
  const handleTextAlignChange = (event, newAlignment) => {
    if (newAlignment !== null) {
      dispatch({
        type: 'UPDATE_READING_PREFERENCES',
        payload: { textAlign: newAlignment }
      });
    }
  };
  
  const handleMarginWidthChange = (event) => {
    dispatch({
      type: 'UPDATE_READING_PREFERENCES',
      payload: { marginWidth: event.target.value }
    });
  };
  
  // Text-to-speech functions
  const startSpeaking = (text) => {
    if (speechSynthesis) {
      // Stop any ongoing speech
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };
  
  const pauseSpeaking = () => {
    if (speechSynthesis) {
      if (isSpeaking) {
        speechSynthesis.pause();
      } else {
        speechSynthesis.resume();
      }
      setIsSpeaking(!isSpeaking);
    }
  };
  
  const stopSpeaking = () => {
    if (speechSynthesis) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Reading Settings
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography id="font-size-slider" gutterBottom>
          Font Size: {readingPreferences.fontSize}px
        </Typography>
        <Slider
          value={readingPreferences.fontSize}
          onChange={handleFontSizeChange}
          aria-labelledby="font-size-slider"
          valueLabelDisplay="auto"
          step={1}
          marks
          min={12}
          max={24}
        />
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <Typography id="line-height-slider" gutterBottom>
          Line Height: {readingPreferences.lineHeight}
        </Typography>
        <Slider
          value={readingPreferences.lineHeight}
          onChange={handleLineHeightChange}
          aria-labelledby="line-height-slider"
          valueLabelDisplay="auto"
          step={0.1}
          marks
          min={1.0}
          max={2.5}
        />
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <FormControl fullWidth>
          <InputLabel id="font-family-select-label">Font Family</InputLabel>
          <Select
            labelId="font-family-select-label"
            value={readingPreferences.fontFamily}
            label="Font Family"
            onChange={handleFontFamilyChange}
          >
            <MenuItem value="system-ui, -apple-system, BlinkMacSystemFont, sans-serif">System UI</MenuItem>
            <MenuItem value="'Segoe UI', Tahoma, Geneva, Verdana, sans-serif">Segoe UI</MenuItem>
            <MenuItem value="'Georgia', serif">Georgia</MenuItem>
            <MenuItem value="'Roboto', sans-serif">Roboto</MenuItem>
            <MenuItem value="'Merriweather', serif">Merriweather</MenuItem>
            <MenuItem value="'Courier New', monospace">Courier New</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <Typography gutterBottom>Text Alignment</Typography>
        <ToggleButtonGroup
          value={readingPreferences.textAlign}
          exclusive
          onChange={handleTextAlignChange}
          aria-label="text alignment"
        >
          <ToggleButton value="left" aria-label="left aligned">
            <FormatAlignLeftIcon />
          </ToggleButton>
          <ToggleButton value="center" aria-label="centered">
            <FormatAlignCenterIcon />
          </ToggleButton>
          <ToggleButton value="justify" aria-label="justified">
            <FormatAlignJustifyIcon />
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <FormControl fullWidth>
          <InputLabel id="margin-width-select-label">Margin Width</InputLabel>
          <Select
            labelId="margin-width-select-label"
            value={readingPreferences.marginWidth}
            label="Margin Width"
            onChange={handleMarginWidthChange}
          >
            <MenuItem value="narrow">Narrow</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="wide">Wide</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {speechSynthesis && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Text-to-Speech
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <ToggleButton
              value="start"
              selected={isSpeaking}
              onChange={() => startSpeaking(document.getElementById('article-content')?.textContent)}
              disabled={isSpeaking}
            >
              <VolumeUpIcon />
            </ToggleButton>
            <ToggleButton
              value="pause"
              onChange={pauseSpeaking}
              disabled={!isSpeaking}
            >
              <PauseIcon />
            </ToggleButton>
            <ToggleButton
              value="stop"
              onChange={stopSpeaking}
              disabled={!isSpeaking}
            >
              <StopIcon />
            </ToggleButton>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default ReadabilityTools;