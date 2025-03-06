document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const editorSection = document.getElementById('editor');
    const gallerySection = document.getElementById('gallery');
    const createNewBtn = document.getElementById('create-new');
    const galleryViewBtn = document.getElementById('gallery-view');
    const pixelCanvas = document.getElementById('pixel-canvas');
    const gridSizeSelect = document.getElementById('grid-size');
    const colorPicker = document.getElementById('color-picker');
    const eraserBtn = document.getElementById('eraser');
    const clearAllBtn = document.getElementById('clear-all');
    const saveArtworkBtn = document.getElementById('save-artwork');
    const saveModal = document.getElementById('save-modal');
    const saveForm = document.getElementById('save-form');
    const cancelSaveBtn = document.getElementById('cancel-save');
    const artworkGrid = document.getElementById('artwork-grid');
    const searchInput = document.getElementById('search');

    // State variables
    let currentColor = '#000000';
    let isDrawing = false;
    let isErasing = false;
    let currentGridSize = 16;
    let artworks = JSON.parse(localStorage.getItem('pixel-artworks')) || [];

    // Initialize the app
    initApp();

    function initApp() {
        // Set up event listeners
        setupEventListeners();
        
        // Initialize the canvas with default grid size
        updateGridSize();
        
        // Load and display saved artworks
        displayArtworks();
    }

    function setupEventListeners() {
        // Navigation
        createNewBtn.addEventListener('click', showEditor);
        galleryViewBtn.addEventListener('click', showGallery);
        
        // Editor controls
        gridSizeSelect.addEventListener('change', updateGridSize);
        colorPicker.addEventListener('input', updateColor);
        eraserBtn.addEventListener('click', toggleEraser);
        clearAllBtn.addEventListener('click', clearCanvas);
        saveArtworkBtn.addEventListener('click', openSaveModal);
        
        // Save modal
        saveForm.addEventListener('submit', saveArtwork);
        cancelSaveBtn.addEventListener('click', closeSaveModal);
        
        // Search
        searchInput.addEventListener('input', filterArtworks);
        
        // Drawing events
        pixelCanvas.addEventListener('mousedown', startDrawing);
        pixelCanvas.addEventListener('mouseup', stopDrawing);
        pixelCanvas.addEventListener('mouseleave', stopDrawing);
        pixelCanvas.addEventListener('mousemove', draw);
        
        // Touch events for mobile
        pixelCanvas.addEventListener('touchstart', handleTouchStart);
        pixelCanvas.addEventListener('touchend', handleTouchEnd);
        pixelCanvas.addEventListener('touchmove', handleTouchMove);
    }

    function showEditor() {
        editorSection.classList.remove('hidden');
        gallerySection.classList.add('hidden');
    }

    function showGallery() {
        editorSection.classList.add('hidden');
        gallerySection.classList.remove('hidden');
    }

    function updateGridSize() {
        currentGridSize = parseInt(gridSizeSelect.value);
        createGrid();
    }

    function createGrid() {
        // Clear existing grid
        pixelCanvas.innerHTML = '';
        
        // Set grid template
        pixelCanvas.style.gridTemplateColumns = `repeat(${currentGridSize}, 1fr)`;
        pixelCanvas.style.gridTemplateRows = `repeat(${currentGridSize}, 1fr)`;
        
        // Set canvas size based on grid size
        const canvasSize = Math.min(window.innerWidth * 0.8, 600);
        pixelCanvas.style.width = `${canvasSize}px`;
        pixelCanvas.style.height = `${canvasSize}px`;
        
        // Create pixels
        for (let i = 0; i < currentGridSize * currentGridSize; i++) {
            const pixel = document.createElement('div');
            pixel.classList.add('pixel');
            pixel.dataset.index = i;
            pixelCanvas.appendChild(pixel);
        }
    }

    function updateColor(e) {
        currentColor = e.target.value;
        isErasing = false;
        eraserBtn.classList.remove('active');
    }

    function toggleEraser() {
        isErasing = !isErasing;
        eraserBtn.classList.toggle('active');
    }

    function clearCanvas() {
        if (confirm('Are you sure you want to clear the canvas?')) {
            const pixels = pixelCanvas.querySelectorAll('.pixel');
            pixels.forEach(pixel => {
                pixel.style.backgroundColor = 'transparent';
            });
        }
    }

    function startDrawing(e) {
        isDrawing = true;
        draw(e);
    }

    function stopDrawing() {
        isDrawing = false;
    }

    function draw(e) {
        if (!isDrawing) return;
        
        const pixel = e.target;
        if (pixel.classList.contains('pixel')) {
            pixel.style.backgroundColor = isErasing ? 'transparent' : currentColor;
        }
    }

    function handleTouchStart(e) {
        e.preventDefault(); // Prevent scrolling
        isDrawing = true;
        const touch = e.touches[0];
        const pixel = document.elementFromPoint(touch.clientX, touch.clientY);
        if (pixel && pixel.classList.contains('pixel')) {
            pixel.style.backgroundColor = isErasing ? 'transparent' : currentColor;
        }
    }

    function handleTouchEnd(e) {
        e.preventDefault();
        isDrawing = false;
    }

    function handleTouchMove(e) {
        e.preventDefault();
        if (!isDrawing) return;
        
        const touch = e.touches[0];
        const pixel = document.elementFromPoint(touch.clientX, touch.clientY);
        if (pixel && pixel.classList.contains('pixel')) {
            pixel.style.backgroundColor = isErasing ? 'transparent' : currentColor;
        }
    }

    function openSaveModal() {
        saveModal.classList.remove('hidden');
    }

    function closeSaveModal() {
        saveModal.classList.add('hidden');
    }

    function saveArtwork(e) {
        e.preventDefault();
        
        const titleInput = document.getElementById('artwork-title');
        const descInput = document.getElementById('artwork-desc');
        
        const title = titleInput.value.trim();
        const description = descInput.value.trim();
        
        if (!title) {
            alert('Please enter a title for your artwork');
            return;
        }
        
        // Generate SVG representation of the pixel art
        const svgData = generateSVG();
        
        // Create new artwork object
        const artwork = {
            id: Date.now().toString(),
            title,
            description,
            svg: svgData,
            gridSize: currentGridSize,
            createdAt: new Date().toISOString()
        };
        
        // Add to artworks array
        artworks.unshift(artwork);
        
        // Save to localStorage
        localStorage.setItem('pixel-artworks', JSON.stringify(artworks));
        
        // Reset form
        titleInput.value = '';
        descInput.value = '';
        
        // Close modal and show gallery
        closeSaveModal();
        showGallery();
        displayArtworks();
    }

    function generateSVG() {
        const pixels = pixelCanvas.querySelectorAll('.pixel');
        let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${currentGridSize} ${currentGridSize}">`;
        
        pixels.forEach((pixel, index) => {
            const row = Math.floor(index / currentGridSize);
            const col = index % currentGridSize;
            const color = pixel.style.backgroundColor;
            
            if (color && color !== 'transparent') {
                svgContent += `<rect x="${col}" y="${row}" width="1" height="1" fill="${color}" />`;
            }
        });
        
        svgContent += '</svg>';
        return svgContent;
    }

    function displayArtworks() {
        artworkGrid.innerHTML = '';
        
        if (artworks.length === 0) {
            artworkGrid.innerHTML = '<p class="no-artworks">No artworks yet. Create one!</p>';
            return;
        }
        
        artworks.forEach(artwork => {
            const card = document.createElement('div');
            card.classList.add('artwork-card');
            card.innerHTML = `
                <div class="artwork-preview">${artwork.svg}</div>
                <div class="artwork-info">
                    <h3 class="artwork-title">${artwork.title}</h3>
                    <p class="artwork-description">${artwork.description || 'No description'}</p>
                </div>
            `;
            
            // Add click event to open artwork in editor
            card.addEventListener('click', () => loadArtwork(artwork));
            
            artworkGrid.appendChild(card);
        });
    }

    function filterArtworks() {
        const searchTerm = searchInput.value.toLowerCase();
        const cards = artworkGrid.querySelectorAll('.artwork-card');
        
        cards.forEach((card, index) => {
            const artwork = artworks[index];
            const isMatch = artwork.title.toLowerCase().includes(searchTerm) || 
                            artwork.description.toLowerCase().includes(searchTerm);
            
            card.style.display = isMatch ? 'block' : 'none';
        });
    }

    function loadArtwork(artwork) {
        // Set grid size to match the artwork
        gridSizeSelect.value = artwork.gridSize;
        updateGridSize();
        
        // Parse SVG to get pixel data
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(artwork.svg, 'image/svg+xml');
        const rects = svgDoc.querySelectorAll('rect');
        
        // Apply colors to pixels
        rects.forEach(rect => {
            const x = parseInt(rect.getAttribute('x'));
            const y = parseInt(rect.getAttribute('y'));
            const color = rect.getAttribute('fill');
            const index = y * currentGridSize + x;
            
            const pixels = pixelCanvas.querySelectorAll('.pixel');
            if (pixels[index]) {
                pixels[index].style.backgroundColor = color;
            }
        });
        
        // Show editor
        showEditor();
    }
});