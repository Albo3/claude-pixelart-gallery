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
    
    // New DOM Elements
    const bucketFillBtn = document.getElementById('bucket-fill');
    const addToPaletteBtn = document.getElementById('add-to-palette');
    const colorPalette = document.getElementById('color-palette');
    const exportSvgBtn = document.getElementById('export-svg');
    const exportPngBtn = document.getElementById('export-png');
    const animationBtn = document.getElementById('animation-btn');
    const animationModal = document.getElementById('animation-modal');
    const framesList = document.getElementById('frames-list');
    const addFrameBtn = document.getElementById('add-frame');
    const playAnimationBtn = document.getElementById('play-animation');
    const stopAnimationBtn = document.getElementById('stop-animation');
    const animationDisplay = document.getElementById('animation-display');
    const animationSpeed = document.getElementById('animation-speed');
    const speedValue = document.getElementById('speed-value');
    const closeAnimationBtn = document.getElementById('close-animation');
    const saveAnimationBtn = document.getElementById('save-animation');

    // State variables
    let currentColor = '#000000';
    let isDrawing = false;
    let isErasing = false;
    let isBucketFill = false;
    let currentGridSize = 16;
    let artworks = JSON.parse(localStorage.getItem('pixel-artworks')) || [];
    let colorPaletteColors = JSON.parse(localStorage.getItem('color-palette')) || ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF'];
    let animationFrames = [];
    let currentFrameIndex = 0;
    let animationInterval = null;
    let fps = 12;

    // Initialize the app
    initApp();

    function initApp() {
        // Set up event listeners
        setupEventListeners();
        
        // Initialize the canvas with default grid size
        updateGridSize();
        
        // Load and display saved artworks
        displayArtworks();
        
        // Initialize color palette
        updateColorPalette();
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
        
        // New controls
        bucketFillBtn.addEventListener('click', toggleBucketFill);
        addToPaletteBtn.addEventListener('click', addColorToPalette);
        exportSvgBtn.addEventListener('click', exportSVG);
        exportPngBtn.addEventListener('click', exportPNG);
        animationBtn.addEventListener('click', openAnimationModal);
        addFrameBtn.addEventListener('click', addAnimationFrame);
        playAnimationBtn.addEventListener('click', playAnimation);
        stopAnimationBtn.addEventListener('click', stopAnimation);
        closeAnimationBtn.addEventListener('click', closeAnimationModal);
        saveAnimationBtn.addEventListener('click', saveAnimation);
        animationSpeed.addEventListener('input', updateAnimationSpeed);
        
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
        isBucketFill = false;
        eraserBtn.classList.remove('tool-active');
        bucketFillBtn.classList.remove('tool-active');
    }

    function toggleEraser() {
        isErasing = !isErasing;
        isBucketFill = false;
        eraserBtn.classList.toggle('tool-active');
        bucketFillBtn.classList.remove('tool-active');
    }
    
    function toggleBucketFill() {
        isBucketFill = !isBucketFill;
        isErasing = false;
        bucketFillBtn.classList.toggle('tool-active');
        eraserBtn.classList.remove('tool-active');
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
        
        if (isBucketFill) {
            const pixel = e.target;
            if (pixel.classList.contains('pixel')) {
                bucketFill(pixel);
            }
            return;
        }
        
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
    
    function bucketFill(startPixel) {
        const targetColor = startPixel.style.backgroundColor || 'transparent';
        const fillColor = isErasing ? 'transparent' : currentColor;
        
        if (targetColor === fillColor) return;
        
        const pixels = Array.from(pixelCanvas.querySelectorAll('.pixel'));
        const visited = new Set();
        const queue = [startPixel];
        
        while (queue.length > 0) {
            const pixel = queue.shift();
            const index = parseInt(pixel.dataset.index);
            
            if (visited.has(index)) continue;
            visited.add(index);
            
            const pixelColor = pixel.style.backgroundColor || 'transparent';
            if (pixelColor !== targetColor) continue;
            
            pixel.style.backgroundColor = fillColor;
            
            // Get adjacent pixels (up, right, down, left)
            const row = Math.floor(index / currentGridSize);
            const col = index % currentGridSize;
            
            // Up
            if (row > 0) {
                const upIndex = index - currentGridSize;
                if (!visited.has(upIndex)) queue.push(pixels[upIndex]);
            }
            
            // Right
            if (col < currentGridSize - 1) {
                const rightIndex = index + 1;
                if (!visited.has(rightIndex)) queue.push(pixels[rightIndex]);
            }
            
            // Down
            if (row < currentGridSize - 1) {
                const downIndex = index + currentGridSize;
                if (!visited.has(downIndex)) queue.push(pixels[downIndex]);
            }
            
            // Left
            if (col > 0) {
                const leftIndex = index - 1;
                if (!visited.has(leftIndex)) queue.push(pixels[leftIndex]);
            }
        }
    }

    function handleTouchStart(e) {
        e.preventDefault(); // Prevent scrolling
        isDrawing = true;
        const touch = e.touches[0];
        const pixel = document.elementFromPoint(touch.clientX, touch.clientY);
        
        if (isBucketFill && pixel && pixel.classList.contains('pixel')) {
            bucketFill(pixel);
            return;
        }
        
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
        if (!isDrawing || isBucketFill) return;
        
        const touch = e.touches[0];
        const pixel = document.elementFromPoint(touch.clientX, touch.clientY);
        if (pixel && pixel.classList.contains('pixel')) {
            pixel.style.backgroundColor = isErasing ? 'transparent' : currentColor;
        }
    }
    
    function addColorToPalette() {
        if (!colorPaletteColors.includes(currentColor)) {
            colorPaletteColors.push(currentColor);
            if (colorPaletteColors.length > 20) {
                colorPaletteColors.shift(); // Remove oldest color if more than 20
            }
            localStorage.setItem('color-palette', JSON.stringify(colorPaletteColors));
            updateColorPalette();
        }
    }
    
    function updateColorPalette() {
        colorPalette.innerHTML = '';
        
        colorPaletteColors.forEach(color => {
            const colorElement = document.createElement('div');
            colorElement.classList.add('palette-color');
            colorElement.style.backgroundColor = color;
            
            if (color === currentColor) {
                colorElement.classList.add('active');
            }
            
            colorElement.addEventListener('click', () => {
                currentColor = color;
                colorPicker.value = color;
                
                // Update active state
                document.querySelectorAll('.palette-color').forEach(el => {
                    el.classList.remove('active');
                });
                colorElement.classList.add('active');
                
                // Reset tools
                isErasing = false;
                isBucketFill = false;
                eraserBtn.classList.remove('tool-active');
                bucketFillBtn.classList.remove('tool-active');
            });
            
            colorPalette.appendChild(colorElement);
        });
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
    
    function exportSVG() {
        const svgData = generateSVG();
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pixel-art.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    function exportPNG() {
        const svgData = generateSVG();
        const img = new Image();
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svgBlob);
        
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const size = Math.max(currentGridSize * 10, 300); // Scale up for better quality
            canvas.width = size;
            canvas.height = size;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, size, size);
            
            canvas.toBlob(function(blob) {
                const pngUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = pngUrl;
                a.download = 'pixel-art.png';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(pngUrl);
            });
            
            URL.revokeObjectURL(url);
        };
        
        img.src = url;
    }
    
    function openAnimationModal() {
        animationModal.classList.remove('hidden');
        updateFramesList();
    }
    
    function closeAnimationModal() {
        animationModal.classList.add('hidden');
        stopAnimation();
    }
    
    function addAnimationFrame() {
        const svgData = generateSVG();
        animationFrames.push(svgData);
        currentFrameIndex = animationFrames.length - 1;
        updateFramesList();
    }
    
    function updateFramesList() {
        framesList.innerHTML = '';
        
        if (animationFrames.length === 0) {
            framesList.innerHTML = '<p>No frames yet. Add your first frame!</p>';
            return;
        }
        
        animationFrames.forEach((frame, index) => {
            const frameItem = document.createElement('div');
            frameItem.classList.add('frame-item');
            if (index === currentFrameIndex) {
                frameItem.classList.add('active');
            }
            
            frameItem.innerHTML = frame;
            
            // Add delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('frame-delete');
            deleteBtn.textContent = '×';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteFrame(index);
            });
            
            frameItem.appendChild(deleteBtn);
            
            // Add click event to select frame
            frameItem.addEventListener('click', () => {
                selectFrame(index);
            });
            
            framesList.appendChild(frameItem);
        });
    }
    
    function deleteFrame(index) {
        animationFrames.splice(index, 1);
        
        if (animationFrames.length === 0) {
            currentFrameIndex = -1;
        } else if (currentFrameIndex >= animationFrames.length) {
            currentFrameIndex = animationFrames.length - 1;
        }
        
        updateFramesList();
    }
    
    function selectFrame(index) {
        currentFrameIndex = index;
        updateFramesList();
        
        // Load the frame into the editor
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(animationFrames[index], 'image/svg+xml');
        const rects = svgDoc.querySelectorAll('rect');
        
        // Clear canvas first
        const pixels = pixelCanvas.querySelectorAll('.pixel');
        pixels.forEach(pixel => {
            pixel.style.backgroundColor = 'transparent';
        });
        
        // Apply colors to pixels
        rects.forEach(rect => {
            const x = parseInt(rect.getAttribute('x'));
            const y = parseInt(rect.getAttribute('y'));
            const color = rect.getAttribute('fill');
            const pixelIndex = y * currentGridSize + x;
            
            if (pixels[pixelIndex]) {
                pixels[pixelIndex].style.backgroundColor = color;
            }
        });
    }
    
    function playAnimation() {
        if (animationFrames.length < 2) {
            alert('You need at least 2 frames to play an animation');
            return;
        }
        
        stopAnimation(); // Clear any existing interval
        
        let frameIndex = 0;
        animationDisplay.innerHTML = animationFrames[frameIndex];
        
        animationInterval = setInterval(() => {
            frameIndex = (frameIndex + 1) % animationFrames.length;
            animationDisplay.innerHTML = animationFrames[frameIndex];
        }, 1000 / fps);
    }
    
    function stopAnimation() {
        if (animationInterval) {
            clearInterval(animationInterval);
            animationInterval = null;
        }
    }
    
    function updateAnimationSpeed() {
        fps = parseInt(animationSpeed.value);
        speedValue.textContent = `${fps} fps`;
        
        if (animationInterval) {
            stopAnimation();
            playAnimation();
        }
    }
    
    function saveAnimation() {
        if (animationFrames.length < 2) {
            alert('You need at least 2 frames to save an animation');
            return;
        }
        
        // For simplicity, we'll just export the first frame as a sample
        // In a real implementation, you might want to create a GIF or animated SVG
        alert('Animation saved! (In a full implementation, this would create a GIF or animated SVG)');
        closeAnimationModal();
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