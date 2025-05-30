import React, { useState, useMemo, useRef } from 'react';
import { Music, Play, Heart, Filter, Volume2 } from 'lucide-react';
import { Search } from 'lucide-react';
import { chordFingerings, jazzProgressions } from '../data/chordData';
import './index.css';

const ChordApp = () => {
  const [selectedStyle, setSelectedStyle] = useState('all');
  const [favorites, setFavorites] = useState(new Set());
  const [selectedProgression, setSelectedProgression] = useState(null);
  const [transposeValue, setTransposeValue] = useState(0);
  const currentAudioRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');

  const expandChordDatabase = (originalChords) => {
    const expandedChords = { ...originalChords };
    
    // Enharmonic equivalents mapping
    const enharmonics = {
      'C#': 'Db', 'Db': 'C#',
      'D#': 'Eb', 'Eb': 'D#', 
      'F#': 'Gb', 'Gb': 'F#',
      'G#': 'Ab', 'Ab': 'G#',
      'A#': 'Bb', 'Bb': 'A#'
    };
    
    // For each chord in the original database
    Object.keys(originalChords).forEach(chordName => {
      const match = chordName.match(/^([A-G][#b]?)(.*)$/);
      if (match) {
        const [, root, type] = match;
        
        // Create enharmonic equivalent if it doesn't exist
        if (enharmonics[root]) {
          const enharmonicChord = enharmonics[root] + type;
          if (!expandedChords[enharmonicChord]) {
            expandedChords[enharmonicChord] = {
              ...originalChords[chordName],
              name: originalChords[chordName].name.replace(root, enharmonics[root])
            };
          }
        }
      }
    });
    
    // Fill common missing chord types by creating them from existing patterns
    const allRoots = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];
    const commonTypes = ['maj7', 'm7', '7', 'm7b5', 'dim7', '9', '13'];
    
    commonTypes.forEach(type => {
      allRoots.forEach(root => {
        const chordName = root + type;
        if (!expandedChords[chordName]) {
          // Try to find a template chord of this type to copy
          const templateChord = Object.keys(originalChords).find(chord => 
            chord.endsWith(type) && originalChords[chord]
          );
          
          if (templateChord) {
            // Create basic fingering by transposing from C or closest available
            const templateRoot = templateChord.match(/^([A-G][#b]?)/)[1];
            const semitonesDiff = getSemitonesDifference(templateRoot, root);
            
            if (semitonesDiff !== null) {
              expandedChords[chordName] = {
                frets: transposeFrets(originalChords[templateChord].frets, semitonesDiff),
                name: `${root} ${getChordTypeName(type)}`
              };
            }
          }
        }
      });
    });
    
    return expandedChords;
  };
  
  // Helper function to get semitone difference
  const getSemitonesDifference = (fromRoot, toRoot) => {
    const noteOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const flatToSharp = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
    
    const normalizedFrom = flatToSharp[fromRoot] || fromRoot;
    const normalizedTo = flatToSharp[toRoot] || toRoot;
    
    const fromIndex = noteOrder.indexOf(normalizedFrom);
    const toIndex = noteOrder.indexOf(normalizedTo);
    
    if (fromIndex === -1 || toIndex === -1) return null;
    
    return (toIndex - fromIndex + 12) % 12;
  };
  
  // Helper function to transpose fret positions
  const transposeFrets = (originalFrets, semitones) => {
    return originalFrets.map(fret => {
      if (fret === 'x') return fret;
      if (fret === '0' && semitones > 0) return semitones.toString();
      if (fret === '0' && semitones < 0) return 'x';
      const newFret = parseInt(fret) + semitones;
      return newFret < 0 ? 'x' : (newFret > 15 ? 'x' : newFret.toString());
    });
  };
  
  // Helper function to get readable chord type names
  const getChordTypeName = (type) => {
    const typeNames = {
      'maj7': 'Major 7',
      'm7': 'Minor 7', 
      '7': 'Dominant 7',
      'm7b5': 'Minor 7♭5',
      'dim7': 'Diminished 7',
      '9': '9th',
      '13': '13th'
    };
    return typeNames[type] || type;
  };

  // Add this right here:
  const jazzStyles = [
    { value: 'all', label: 'All Styles', count: jazzProgressions.length },
    { value: 'traditional', label: 'Traditional Standards', count: jazzProgressions.filter(p => p.style === 'traditional').length },
    { value: 'bebop', label: 'Bebop', count: jazzProgressions.filter(p => p.style === 'bebop').length },
    { value: 'cool', label: 'Cool Jazz', count: jazzProgressions.filter(p => p.style === 'cool').length },
    { value: 'hardbop', label: 'Hard Bop', count: jazzProgressions.filter(p => p.style === 'hardbop').length },
    { value: 'modal', label: 'Modal Jazz', count: jazzProgressions.filter(p => p.style === 'modal').length },
    { value: 'free', label: 'Free Jazz', count: jazzProgressions.filter(p => p.style === 'free').length },
    { value: 'fusion', label: 'Fusion', count: jazzProgressions.filter(p => p.style === 'fusion').length },
    { value: 'contemporary', label: 'Contemporary', count: jazzProgressions.filter(p => p.style === 'contemporary').length },
    { value: 'latin', label: 'Latin Jazz', count: jazzProgressions.filter(p => p.style === 'latin').length },
    { value: 'smooth', label: 'Smooth Jazz', count: jazzProgressions.filter(p => p.style === 'smooth').length },
    { value: 'swing', label: 'Swing Era', count: jazzProgressions.filter(p => p.style === 'swing').length },
    { value: 'gypsy jazz', label: 'Gypsy Jazz', count: jazzProgressions.filter(p => p.style === 'gypsy jazz').length },
    { value: 'soul jazz', label: 'Soul Jazz', count: jazzProgressions.filter(p => p.style === 'soul jazz').length },
    { value: 'calypso', label: 'Calypso', count: jazzProgressions.filter(p => p.style === 'calypso').length }
  ];

  const expandedChordFingerings = useMemo(() => {
    return expandChordDatabase(chordFingerings);
  }, []);

  // Initialize audio context and load Tone.js
  const initializeAudio = async () => {
    try {
      // Dynamic import of Tone.js
      const ToneModule = await import('tone');
      const Tone = ToneModule.default || ToneModule;
      
      // Start the audio context
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }
      
      return Tone;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      throw error;
    }
  };
  // Guitar string tuning (standard tuning from low E to high E)
// Add this function after your initializeAudio function:
const stopCurrentAudio = () => {
  if (currentAudioRef.current) {
    const { synth, filter, timeout } = currentAudioRef.current;
    
    // Clear the cleanup timeout
    if (timeout) {
      clearTimeout(timeout);
    }
    
    // Immediately dispose of synth and filter
    if (synth) {
      synth.dispose();
    }
    if (filter) {
      filter.dispose();
    }
    
    // Clear the ref
    currentAudioRef.current = null;
  }
};

  // Convert fret number to note
  const fretToNote = (stringIndex, fret) => {
    if (fret === 'x') return null; // Muted string
    
    const baseNotes = ['E', 'A', 'D', 'G', 'B', 'E'];
    const baseOctaves = [2, 2, 3, 3, 3, 4];
    
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const baseNote = baseNotes[stringIndex];
    const baseOctave = baseOctaves[stringIndex];
    
    // Find the base note index
    let baseNoteIndex = noteNames.indexOf(baseNote);
    let octave = baseOctave;
    
    // Calculate the final note
    let finalNoteIndex = (baseNoteIndex + parseInt(fret)) % 12;
    
    // Handle octave changes
    if (baseNoteIndex + parseInt(fret) >= 12) {
      octave += Math.floor((baseNoteIndex + parseInt(fret)) / 12);
    }
    
    return noteNames[finalNoteIndex] + octave;
  };

  // Transpose logic
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  const transposeChord = (chordName, semitones) => {
    if (semitones === 0) return chordName;
    
    // Extract root note and chord type
    const match = chordName.match(/^([A-G][#b]?)(.*)$/);
    if (!match) return chordName;
    
    const [, rootNote, chordType] = match;
    
    // Convert flat to sharp for consistency, handle special cases
    let normalizedRoot = rootNote;
    const flatToSharp = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
    if (flatToSharp[rootNote]) {
      normalizedRoot = flatToSharp[rootNote];
    }
    
    // Find current note index
    let noteIndex = noteNames.indexOf(normalizedRoot);
    if (noteIndex === -1) return chordName;
    
    // Transpose
    const newNoteIndex = (noteIndex + semitones + 12) % 12;
    let newRoot = noteNames[newNoteIndex];
    
    // Convert sharps back to flats to match your database preference
    const sharpToFlat = { 'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb' };
    newRoot = sharpToFlat[newRoot] || newRoot;
    
    const transposedChord = newRoot + chordType;
    
    // If the exact chord doesn't exist, try common variations
    if (!chordFingerings[transposedChord]) {
      // Try removing voicing suffixes (_v2, _v3, etc.)
      const baseChordName = transposedChord.replace(/_v\d+$/, '');
      if (chordFingerings[baseChordName]) {
        return baseChordName;
      }
      
      // Try alternative chord names
      const alternatives = getChordAlternatives(transposedChord);
      for (const alt of alternatives) {
        if (chordFingerings[alt]) {
          return alt;
        }
      }
    }
    
    return transposedChord;
  };
  
  // Helper function for chord alternatives
  const getChordAlternatives = (chordName) => {
    const alternatives = [];
    
    // Convert between sharps and flats
    const sharpToFlat = { 'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb' };
    const flatToSharp = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#' };
    
    const match = chordName.match(/^([A-G][#b]?)(.*)$/);
    if (match) {
      const [, root, type] = match;
      
      // Try the opposite enharmonic
      if (sharpToFlat[root]) {
        alternatives.push(sharpToFlat[root] + type);
      }
      if (flatToSharp[root]) {
        alternatives.push(flatToSharp[root] + type);
      }
      
      // Try simplified chord types
      if (type.includes('alt')) {
        alternatives.push(root + '7');
        alternatives.push(root + '7b9');
        alternatives.push(root + '7#9');
      }
      
      // Try with voicing variations
      alternatives.push(chordName + '_v2');
      alternatives.push(chordName + '_v3');
    }
    
    return alternatives;
  };
  
  const transposeFingering = (originalFrets, semitones) => {
    if (semitones === 0) return originalFrets;
    
    return originalFrets.map(fret => {
      if (fret === 'x') return fret; // Keep muted strings
      if (fret === '0' && semitones > 0) {
        // Open string becomes fretted
        return semitones.toString();
      }
      if (fret === '0' && semitones < 0) {
        // Can't go lower than open, keep as open or mute
        return 'x';
      }
      const newFret = parseInt(fret) + semitones;
      return newFret < 0 ? 'x' : newFret.toString();
    });
  };

// Play transposed chord sound
const playChordTransposed = async (chordName, fingering) => {
  try {
    // Stop any currently playing audio first
    stopCurrentAudio();
    
    const Tone = await initializeAudio();

    // Create synth for guitar-like sound
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.02,
        decay: 0.3,
        sustain: 0.5,
        release: 1.5
      },
      volume: -12
    }).toDestination();

    // Apply guitar-like filter
    const filter = new Tone.Filter(1000, 'lowpass').toDestination();
    synth.connect(filter);

    // Get notes using transposed fingering
    const notes = [];
    fingering.frets.forEach((fret, stringIndex) => {
      const note = fretToNote(stringIndex, fret);
      if (note) {
        notes.push(note);
      }
    });

    if (notes.length > 0) {
      synth.triggerAttackRelease(notes, '2n');
      
      // Store current audio and setup cleanup
      const timeout = setTimeout(() => {
        synth.dispose();
        filter.dispose();
        currentAudioRef.current = null;
      }, 3000);
      
      // Store in ref for potential early cleanup
      currentAudioRef.current = { synth, filter, timeout };
    }
  } catch (error) {
    console.error('Audio playback failed:', error);
  }
};

const filteredProgressions = useMemo(() => {
  let filtered = selectedStyle === 'all' 
    ? jazzProgressions 
    : jazzProgressions.filter(prog => prog.style === selectedStyle);
  
  // Apply search filter if there's a search query
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(prog => {
      // Search in progression name/title
      const nameMatch = prog.name.toLowerCase().includes(query);
      
      // Search in chord names
      const chordsMatch = prog.chords.some(chord => 
        chord.toLowerCase().includes(query)
      );
      
      // Search in style/label
      const styleMatch = prog.style.toLowerCase().includes(query);
      
      // Search in key
      const keyMatch = prog.key.toLowerCase().includes(query);
      
      return nameMatch || chordsMatch || styleMatch || keyMatch;
    });
  }
  
  return filtered;
}, [selectedStyle, searchQuery, jazzProgressions]);

const toggleFavorite = (id) => {
  const newFavorites = new Set(favorites);
  if (favorites.has(id)) {
    newFavorites.delete(id);
  } else {
    newFavorites.add(id);
  }
  setFavorites(newFavorites);
};

  const ChordDiagram = ({ chord }) => {
    const transposedChord = transposeChord(chord, transposeValue);
    const originalFingering = expandedChordFingerings[chord];
    
    if (!originalFingering) return <div className="chord-not-found">Chord not found</div>;

    const transposedFingering = {
      ...originalFingering,
      frets: transposeFingering(originalFingering.frets, transposeValue),
      name: originalFingering.name.replace(chord.replace(/[^A-G#b]/g, ''), transposedChord.replace(/[^A-G#b]/g, ''))
    };

    const handleChordClick = () => {
      // Use transposed chord for sound
      playChordTransposed(transposedChord, transposedFingering);
    };

    return (
      <div className="chord-diagram" onClick={handleChordClick}>
        <div className="chord-header">
          <div className="chord-name-with-sound">
            <div className="chord-name">{transposedChord}</div>
            <Volume2 size={16} className="sound-icon" />
          </div>
          <div className="chord-full-name">{transposedFingering.name}</div>
        </div>
        
        <div className="chord-tab">
          <div className="string-labels">E A D G B E</div>
          <div className="fret-positions">
            {transposedFingering.frets.join(' ')}
          </div>
        </div>
        
        <div className="fretboard-visual">
          {transposedFingering.frets.map((fret, index) => (
            <div key={index} className="fret-box">
              {fret === 'x' ? '×' : fret}
            </div>
          ))}
        </div>
        
        <div className="click-to-play">Click to play sound</div>
      </div>
    );
  };

  const ProgressionCard = ({ progression }) => {
    const isFavorite = favorites.has(progression.id);
    
    return (
      <div className="progression-card">
        <div className="progression-header">
          <div className="progression-info">
            <h3 className="progression-name">{progression.name}</h3>
            <div className="progression-meta">
              <span className="style-badge">
                {jazzStyles.find(s => s.value === progression.style)?.label}
              </span>
              <span className="key-info">Key: {progression.key}</span>
            </div>
          </div>
          <div className="progression-actions">
            <button
              onClick={() => toggleFavorite(progression.id)}
              className={`favorite-btn ${isFavorite ? 'favorited' : ''}`}
            >
              <Heart size={20} />
            </button>
            <button
              onClick={() => setSelectedProgression(selectedProgression === progression.id ? null : progression.id)}
              className="show-chords-btn"
            >
              <Play size={16} />
              {selectedProgression === progression.id ? 'Hide' : 'Show'} Chords
            </button>
          </div>
        </div>
        
        <div className="chord-sequence">
          {progression.chords.map((chord, index) => (
            <span key={index} className="chord-chip">
              {transposeChord(chord, transposeValue)}
            </span>
          ))}
        </div>
        
        {selectedProgression === progression.id && (
          <div className="chord-diagrams-section">
            <h4 className="diagrams-title">Chord Fingerings:</h4>
            <div className="chord-diagrams-grid">
              {progression.chords.map((chord, index) => (
                <ChordDiagram key={index} chord={chord} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="jazz-chord-app">
      <div className="container">
        {/* Header */}
        <div className="app-header">
  {/* Hayzer Logo Title */}
  <div className="title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
    <span style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>Hayzer</span>
    <span className="lightning">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="#FFD700"  stroke="#000"  strokeWidth="1">
        <path d="M13 2L4.5 12.5H11L10 22L18.5 11.5H12L13 2Z"></path>
      </svg>
    </span>
    <span style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>Apps</span>
  </div>

  {/* Main App Title */}
  <div className="header-title" style={{ marginTop: '1rem' }}>
    <Music size={40} />
    <h1>Jazz Guitar Chord Progressions</h1>
  </div>

  <p className="header-subtitle">
    Explore hundreds of jazz chord progressions across all styles
  </p>
</div>


        {/* Style Filter */}
        <div className="filter-section">
          <div className="filter-header">
            <Filter size={20} />
            <h2>Filter by Jazz Style</h2>
          </div>
          <div className="style-grid">
            {jazzStyles.map((style) => (
              <button
                key={style.value}
                onClick={() => setSelectedStyle(style.value)}
                className={`style-button ${selectedStyle === style.value ? 'active' : ''}`}
              >
                <div className="style-name">{style.label}</div>
                <div className="style-count">{style.count} progressions</div>
              </button>
            ))}
          </div>
        </div>

        {/* Search Section */}
<div className="search-section">
  <div className="search-header">
    <Search size={20} />
    <h2>Search Progressions</h2>
  </div>
  <div className="search-input-container">
    <input
      type="text"
      placeholder="Search by song title, artist, chord, or style..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="search-input"
    />
    {searchQuery && (
      <button
        onClick={() => setSearchQuery('')}
        className="clear-search-btn"
        aria-label="Clear search"
      >
        ×
      </button>
    )}
  </div>
  {searchQuery && (
    <div className="search-results-info">
      Found {filteredProgressions.length} progression{filteredProgressions.length !== 1 ? 's' : ''} 
      {searchQuery && ` matching "${searchQuery}"`}
    </div>
  )}
</div>

        {/* Transpose Section */}
        <div className="transpose-section">
          <div className="transpose-header">
            <h2>Transpose</h2>
          </div>
          <div className="transpose-controls">
            <button 
              onClick={() => setTransposeValue(Math.max(transposeValue - 1, -7))}
              disabled={transposeValue <= -7}
              className="transpose-btn"
            >
              -1
            </button>
            <div className="transpose-display">
              {transposeValue === 0 ? 'Original' : `${transposeValue > 0 ? '+' : ''}${transposeValue}`}
            </div>
            <button 
              onClick={() => setTransposeValue(Math.min(transposeValue + 1, 7))}
              disabled={transposeValue >= 7}
              className="transpose-btn"
            >
              +1
            </button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="results-summary">
          <h2>
            {filteredProgressions.length} {selectedStyle === 'all' ? 'Total' : jazzStyles.find(s => s.value === selectedStyle)?.label} Progressions
          </h2>
        </div>

        {/* Progressions Grid */}
        <div className="progressions-grid">
          {filteredProgressions.map((progression) => (
            <ProgressionCard key={progression.id} progression={progression} />
          ))}
        </div>

        {/* Footer */}
        <div className="app-footer">
          <p>Chord fingerings shown as fret positions: Low E - A - D - G - B - High E</p>
          <p>'x' = don't play string, '0' = open string, numbers = fret positions</p>
        </div>
      </div>
    </div>
  );
};

export default ChordApp;