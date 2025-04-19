// Selection icon module for SkyShade
console.log('[SkyShade] [ICON] Selection icon module loaded');

class SelectionIcon {
    constructor() {
        this.icon = null;
        this.lastMousePosition = { x: 0, y: 0 };
        this.ctrlAPressed = false; // Track Ctrl+A usage
        this.initEventListeners();
    }

    // Initialize the icon element
    createIcon() {
        if (this.icon) return this.icon;
        
        this.icon = document.createElement('div');
        this.icon.id = 'skyshade-selection-icon';
        
        // Use the SkyShade logo as the icon
        this.icon.innerHTML = `
            <div class="skyshade-icon-container">
                <img src="${chrome.runtime.getURL('icons/icon.png')}" alt="SkyShade" />
            </div>
        `;
        
        // Add a tooltip attribute
        this.icon.title = 'SkyShade - Text anonymizer';
        
        // Style the icon and ensure image fits properly
        this.icon.style.cssText = `
            position: absolute;
            z-index: 9999;
            background: #ffffff;
            border-radius: 50%;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            display: none;
            cursor: pointer;
            padding: 5px;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        // Add styles to make sure the image fits inside the circle
        const iconImage = this.icon.querySelector('img');
        iconImage.style.cssText = `
            max-width: 100%;
            max-height: 100%;
            width: 22px; /* Adjust as needed */
            height: auto;
            object-fit: contain;
        `;
        
        document.body.appendChild(this.icon);
        return this.icon;
    }

    // Set up event listeners
    initEventListeners() {
        // Track mouse position for fallback positioning
        document.addEventListener('mousemove', (e) => {
            this.lastMousePosition = { x: e.clientX, y: e.clientY };
        });
        
        // Hide icon when clicking outside
        document.addEventListener('mousedown', (e) => {
            if (this.icon && !this.icon.contains(e.target)) 
                this.hide();
            
            // Reset Ctrl+A flag on mouse interactions
            this.ctrlAPressed = false;
        });
        
        // Detect Ctrl+A key combination
        document.addEventListener('keydown', (e) => {
            // Check for Ctrl+A (key code 65 is 'A')
            if (e.ctrlKey && e.key.toLowerCase() === 'a') {
                console.log('[SkyShade] [ICON] Ctrl+A detected');
                this.ctrlAPressed = true;
                
                // Reset the flag after a short delay (in case selection changes)
                setTimeout(() => {
                    this.ctrlAPressed = false;
                }, 1000);
            }
            else 
                // Reset on other key presses
                this.ctrlAPressed = false;
            
        });

        // Reset flag when selection changes
        document.addEventListener('selectionchange', () => {
            // Don't reset immediately to allow our handling code to check the flag
            setTimeout(() => {
                this.ctrlAPressed = false;
            }, 100);
        });
    }

    // Add click handler
    setClickHandler(callback) {
        if (!this.icon) this.createIcon();
        this.icon.addEventListener('click', callback);
    }

    // Show the icon at specified coordinates
    show(right, top, bottom, centerAtTop = false) {
        if (!this.icon) this.createIcon();
        
        // Calculate the final position with offsets and scroll
        const iconX = right + window.scrollX + 15; // Position to the right with 30px offset
        let iconY = bottom ? bottom : top + window.scrollY;
        
        if (!centerAtTop)
            iconY = bottom; //top + window.scrollY + (height / 2); // Center vertically if height provided
        else
            iconY = top ;
        
        this.icon.style.left = `${iconX}px`;
        this.icon.style.top = `${iconY}px`;
        this.icon.style.display = 'flex';
        
        // Force the icon to be visible
        this.icon.style.visibility = 'visible';
        this.icon.style.opacity = '1';
        
        
        // Verify the icon is in the DOM
        if (!document.body.contains(this.icon)) {
            console.warn('[SkyShade] [ICON] Icon not in DOM, re-appending');
            document.body.appendChild(this.icon);
        }

        return true;
    }

    // Hide the icon
    hide() {
        if (this.icon) 
            this.icon.style.display = 'none';
        
    }

    // Position the icon relative to a selection
    positionFromSelection(selection, inEditableArea) {
        if (!selection || !inEditableArea || selection.toString().trim().length === 0) {
            this.hide();
            return false;
        }

        const range = selection.getRangeAt(0);
        const commonAncestor = range.commonAncestorContainer;
        const rect = range.getBoundingClientRect();
        
        // Check if this is a Ctrl+A operation
        const isCtrlA = this.isLikelySelectAll();
        
        if (isCtrlA) 
            return this.positionForCtrlASelection(selection, commonAncestor, true);
        
        // For regular selections, use standard positioning if the rect is valid
        if (rect.width > 0 && rect.height > 0)   
            this.show(rect.right, rect.top, rect.height, rect.bottom);
        else  
            this.positionWithFallbackMethods(selection, commonAncestor, false);
        
    }

    // Get a more accurate positioning based on the actual text content
    positionForCtrlASelection(selection, commonAncestor) {
        const editableElement = this.findEditableElement(commonAncestor);
        
        if (!editableElement) 
            return this.positionWithFallbackMethods(selection, commonAncestor);
        
        try {
            // For input/textarea, we need special handling
            if (editableElement.tagName === 'INPUT' || editableElement.tagName === 'TEXTAREA') {
                const elementRect = editableElement.getBoundingClientRect();
                return this.show(elementRect.right, elementRect.top, elementRect.height, elementRect.bottom);
            }
            
            // For contentEditable elements, we can try to get the text nodes
            if (editableElement.isContentEditable) {
                // Find text nodes to get more accurate positioning
                const textNodes = this.getTextNodesIn(editableElement);

                if (textNodes.length === 0)
                    return this.positionWithFallbackMethods(selection, commonAncestor);
                
                // Create a range encompassing just the text content
                const textRange = document.createRange();
                textRange.setStart(textNodes[0], 0);
                textRange.setEnd(textNodes[textNodes.length - 1], textNodes[textNodes.length - 1].length);

                const textRect = textRange.getBoundingClientRect();

                if (textRect.width > 0 && textRect.height > 0) 
                    return this.show(textRect.right, textRect.top, textRect.height, textRect.bottom);
                
            }
        }
        catch (e) {
            console.error('[SkyShade] Error getting text positioning:', e);
        }
        
        // Fallback to element-based positioning
        return this.positionWithFallbackMethods(selection, commonAncestor, isCtrlA);
    }

    // Helper function to get all text nodes in an element
    getTextNodesIn(node) {
        const textNodes = [];
        if (!node) return textNodes;
        
        const walker = document.createTreeWalker(
            node,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    // Skip empty text nodes
                    if (node.nodeValue.trim().length === 0) 
                        return NodeFilter.FILTER_REJECT;
                    
                    return NodeFilter.FILTER_ACCEPT;
                },
            },
            false,
        );
        
        let currentNode;
        while (currentNode = walker.nextNode()) 
            textNodes.push(currentNode);
        
        
        return textNodes;
    }

    // Handle fallback positioning methods when standard positioning fails
    positionWithFallbackMethods(selection, commonAncestor) {
        console.log('[SkyShade] [ICON] Positioning with fallback methods');
        const editableElement = this.findEditableElement(commonAncestor);
        
        if (editableElement) {
            const elementRect = editableElement.getBoundingClientRect();
            return this.show(elementRect.right, elementRect.top, elementRect.height, elementRect.bottom);
        }

        
        // Previous fallback code for non-select-all cases
        const focusNode = selection.focusNode;
        
        if (focusNode && focusNode.parentElement) {

            const focusRect = focusNode.parentElement.getBoundingClientRect();

            if (focusRect.width > 0 && focusRect.height > 0) 
                return this.show(focusRect.right + 15, focusRect.top, -1, focusRect.bottom, true);
            
            
        }
        
        // Mouse position fallback (last resort)
        if (this.lastMousePosition) 
            return this.show(this.lastMousePosition.x, this.lastMousePosition.y, -1, -1);
        
        return false;
    }
    // Simplified function that just checks if Ctrl+A was pressed
    isLikelySelectAll() {
        // Simply return the tracked state of Ctrl+A
        return this.ctrlAPressed;
    }

    // Helper function to find the actual editable element from an ancestor
    findEditableElement(node) {
        if (!node) return null;
        
        // Check if the node itself is editable
        if ((node.tagName === 'INPUT' && 
             ['text', 'search', 'email', 'url', 'number', 'tel', 'password'].includes(node.type)) ||
            node.tagName === 'TEXTAREA' ||
            node.isContentEditable) 
            return node;
        
        // If node is text node, check its parent
        if (node.nodeType === Node.TEXT_NODE && node.parentNode) 
            return this.findEditableElement(node.parentNode);
        
        // Check if any parent is editable by walking up the tree
        let current = node;
        while (current && current !== document.body) {
            if ((current.tagName === 'INPUT' && 
                 ['text', 'search', 'email', 'url', 'number', 'tel', 'password'].includes(current.type)) ||
                current.tagName === 'TEXTAREA' ||
                current.isContentEditable) 
                return current;
            
            current = current.parentNode;
        }
        
        return null;
    }
}

// Export a singleton instance
const selectionIcon = new SelectionIcon();
export default selectionIcon; 