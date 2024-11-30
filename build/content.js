/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
/*!********************************!*\
  !*** ./src/content/content.js ***!
  \********************************/
__webpack_require__.r(__webpack_exports__);
async function cleanSelectedText(selection) {
    const originalText = selection.toString();
    let loadingIndicator;

    console.log('[CONTENT] Starting text cleaning process');
    console.log('[CONTENT] Selected text:', originalText);

    try {
        const originalRange = selection.getRangeAt(0).cloneRange();
        
        loadingIndicator = showLoadingIndicator(selection);
        
        console.log('[CONTENT] Sending message to background script');
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'CLEAN_TEXT',
                text: originalText
            });
            
            console.log('[CONTENT] Received response from background:', response);
            
            if (response.error) {
                console.error('[CONTENT] Error in response:', response.error);
                throw new Error(response.error);
            }

            if (loadingIndicator && loadingIndicator.parentNode) {
                loadingIndicator.remove();
            }

            console.log('[CONTENT] Replacing text with:', response.cleanedText);
            
            selection.removeAllRanges();
            selection.addRange(originalRange);
            
            const range = selection.getRangeAt(0);
            range.deleteContents();
            const textNode = document.createTextNode(response.cleanedText);
            range.insertNode(textNode);
            
            selection.removeAllRanges();
        } catch (err) {
            console.error('[CONTENT] Message sending failed:', err);
            if (loadingIndicator && loadingIndicator.parentNode) {
                loadingIndicator.replaceWith(document.createTextNode(originalText));
            }
            alert('Failed to clean text. Please try reloading the page.');
        }
    } catch (error) {
        console.error('[CONTENT] Error in cleanSelectedText:', error);
        if (loadingIndicator && loadingIndicator.parentNode) {
            loadingIndicator.replaceWith(document.createTextNode(originalText));
        }
    }
}

function showLoadingIndicator(selection) {
    const range = selection.getRangeAt(0).cloneRange();
    const loadingSpan = document.createElement('span');
    loadingSpan.textContent = 'Anonymizing...';
    loadingSpan.id = 'anonymization-loading';
    loadingSpan.style.backgroundColor = '#f0f0f0';
    loadingSpan.style.padding = '2px 4px';
    loadingSpan.style.borderRadius = '3px';
    
    range.deleteContents();
    range.insertNode(loadingSpan);
    
    return loadingSpan;
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[CONTENT] Received message:', message);
    
    if (message.command === "cleanSelection") {
        console.log('[CONTENT] Processing cleanSelection command');
        const selection = window.getSelection();
        if (selection.toString().length > 0) {
            cleanSelectedText(selection);
        } else {
            console.log('[CONTENT] No text selected');
        }
    }
});

// Add initialization log
console.log('[CONTENT] Content script loaded');

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudC5qcyIsIm1hcHBpbmdzIjoiOztVQUFBO1VBQ0E7Ozs7O1dDREE7V0FDQTtXQUNBO1dBQ0EsdURBQXVELGlCQUFpQjtXQUN4RTtXQUNBLGdEQUFnRCxhQUFhO1dBQzdEOzs7Ozs7Ozs7QUNOQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBLENBQUM7O0FBRUQ7QUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL2phbml0b3Ivd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vamFuaXRvci93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL2phbml0b3IvLi9zcmMvY29udGVudC9jb250ZW50LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIFRoZSByZXF1aXJlIHNjb3BlXG52YXIgX193ZWJwYWNrX3JlcXVpcmVfXyA9IHt9O1xuXG4iLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJhc3luYyBmdW5jdGlvbiBjbGVhblNlbGVjdGVkVGV4dChzZWxlY3Rpb24pIHtcbiAgICBjb25zdCBvcmlnaW5hbFRleHQgPSBzZWxlY3Rpb24udG9TdHJpbmcoKTtcbiAgICBsZXQgbG9hZGluZ0luZGljYXRvcjtcblxuICAgIGNvbnNvbGUubG9nKCdbQ09OVEVOVF0gU3RhcnRpbmcgdGV4dCBjbGVhbmluZyBwcm9jZXNzJyk7XG4gICAgY29uc29sZS5sb2coJ1tDT05URU5UXSBTZWxlY3RlZCB0ZXh0OicsIG9yaWdpbmFsVGV4dCk7XG5cbiAgICB0cnkge1xuICAgICAgICBjb25zdCBvcmlnaW5hbFJhbmdlID0gc2VsZWN0aW9uLmdldFJhbmdlQXQoMCkuY2xvbmVSYW5nZSgpO1xuICAgICAgICBcbiAgICAgICAgbG9hZGluZ0luZGljYXRvciA9IHNob3dMb2FkaW5nSW5kaWNhdG9yKHNlbGVjdGlvbik7XG4gICAgICAgIFxuICAgICAgICBjb25zb2xlLmxvZygnW0NPTlRFTlRdIFNlbmRpbmcgbWVzc2FnZSB0byBiYWNrZ3JvdW5kIHNjcmlwdCcpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7XG4gICAgICAgICAgICAgICAgdHlwZTogJ0NMRUFOX1RFWFQnLFxuICAgICAgICAgICAgICAgIHRleHQ6IG9yaWdpbmFsVGV4dFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdbQ09OVEVOVF0gUmVjZWl2ZWQgcmVzcG9uc2UgZnJvbSBiYWNrZ3JvdW5kOicsIHJlc3BvbnNlKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignW0NPTlRFTlRdIEVycm9yIGluIHJlc3BvbnNlOicsIHJlc3BvbnNlLmVycm9yKTtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IocmVzcG9uc2UuZXJyb3IpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAobG9hZGluZ0luZGljYXRvciAmJiBsb2FkaW5nSW5kaWNhdG9yLnBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgICAgICBsb2FkaW5nSW5kaWNhdG9yLnJlbW92ZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW0NPTlRFTlRdIFJlcGxhY2luZyB0ZXh0IHdpdGg6JywgcmVzcG9uc2UuY2xlYW5lZFRleHQpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBzZWxlY3Rpb24ucmVtb3ZlQWxsUmFuZ2VzKCk7XG4gICAgICAgICAgICBzZWxlY3Rpb24uYWRkUmFuZ2Uob3JpZ2luYWxSYW5nZSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNvbnN0IHJhbmdlID0gc2VsZWN0aW9uLmdldFJhbmdlQXQoMCk7XG4gICAgICAgICAgICByYW5nZS5kZWxldGVDb250ZW50cygpO1xuICAgICAgICAgICAgY29uc3QgdGV4dE5vZGUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShyZXNwb25zZS5jbGVhbmVkVGV4dCk7XG4gICAgICAgICAgICByYW5nZS5pbnNlcnROb2RlKHRleHROb2RlKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc2VsZWN0aW9uLnJlbW92ZUFsbFJhbmdlcygpO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tDT05URU5UXSBNZXNzYWdlIHNlbmRpbmcgZmFpbGVkOicsIGVycik7XG4gICAgICAgICAgICBpZiAobG9hZGluZ0luZGljYXRvciAmJiBsb2FkaW5nSW5kaWNhdG9yLnBhcmVudE5vZGUpIHtcbiAgICAgICAgICAgICAgICBsb2FkaW5nSW5kaWNhdG9yLnJlcGxhY2VXaXRoKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKG9yaWdpbmFsVGV4dCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYWxlcnQoJ0ZhaWxlZCB0byBjbGVhbiB0ZXh0LiBQbGVhc2UgdHJ5IHJlbG9hZGluZyB0aGUgcGFnZS4nKTtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tDT05URU5UXSBFcnJvciBpbiBjbGVhblNlbGVjdGVkVGV4dDonLCBlcnJvcik7XG4gICAgICAgIGlmIChsb2FkaW5nSW5kaWNhdG9yICYmIGxvYWRpbmdJbmRpY2F0b3IucGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgbG9hZGluZ0luZGljYXRvci5yZXBsYWNlV2l0aChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShvcmlnaW5hbFRleHQpKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gc2hvd0xvYWRpbmdJbmRpY2F0b3Ioc2VsZWN0aW9uKSB7XG4gICAgY29uc3QgcmFuZ2UgPSBzZWxlY3Rpb24uZ2V0UmFuZ2VBdCgwKS5jbG9uZVJhbmdlKCk7XG4gICAgY29uc3QgbG9hZGluZ1NwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgbG9hZGluZ1NwYW4udGV4dENvbnRlbnQgPSAnQW5vbnltaXppbmcuLi4nO1xuICAgIGxvYWRpbmdTcGFuLmlkID0gJ2Fub255bWl6YXRpb24tbG9hZGluZyc7XG4gICAgbG9hZGluZ1NwYW4uc3R5bGUuYmFja2dyb3VuZENvbG9yID0gJyNmMGYwZjAnO1xuICAgIGxvYWRpbmdTcGFuLnN0eWxlLnBhZGRpbmcgPSAnMnB4IDRweCc7XG4gICAgbG9hZGluZ1NwYW4uc3R5bGUuYm9yZGVyUmFkaXVzID0gJzNweCc7XG4gICAgXG4gICAgcmFuZ2UuZGVsZXRlQ29udGVudHMoKTtcbiAgICByYW5nZS5pbnNlcnROb2RlKGxvYWRpbmdTcGFuKTtcbiAgICBcbiAgICByZXR1cm4gbG9hZGluZ1NwYW47XG59XG5cbi8vIExpc3RlbiBmb3IgbWVzc2FnZXMgZnJvbSB0aGUgYmFja2dyb3VuZCBzY3JpcHRcbmNocm9tZS5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcigobWVzc2FnZSwgc2VuZGVyLCBzZW5kUmVzcG9uc2UpID0+IHtcbiAgICBjb25zb2xlLmxvZygnW0NPTlRFTlRdIFJlY2VpdmVkIG1lc3NhZ2U6JywgbWVzc2FnZSk7XG4gICAgXG4gICAgaWYgKG1lc3NhZ2UuY29tbWFuZCA9PT0gXCJjbGVhblNlbGVjdGlvblwiKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdbQ09OVEVOVF0gUHJvY2Vzc2luZyBjbGVhblNlbGVjdGlvbiBjb21tYW5kJyk7XG4gICAgICAgIGNvbnN0IHNlbGVjdGlvbiA9IHdpbmRvdy5nZXRTZWxlY3Rpb24oKTtcbiAgICAgICAgaWYgKHNlbGVjdGlvbi50b1N0cmluZygpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNsZWFuU2VsZWN0ZWRUZXh0KHNlbGVjdGlvbik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnW0NPTlRFTlRdIE5vIHRleHQgc2VsZWN0ZWQnKTtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuXG4vLyBBZGQgaW5pdGlhbGl6YXRpb24gbG9nXG5jb25zb2xlLmxvZygnW0NPTlRFTlRdIENvbnRlbnQgc2NyaXB0IGxvYWRlZCcpO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9