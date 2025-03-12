// 🚀 Portfolio Summary Block plugin for Squarespace by SquareHero.store
// Immediate hiding of placeholders before CSS loads
(function() {
  // Quick hide function for immediate hiding
  function quickHide() {
    const placeholders = document.querySelectorAll('.sqs-block-summary-v2 .sqs-block-is-placeholder');
    placeholders.forEach(placeholder => {
      placeholder.style.visibility = 'hidden';
      placeholder.style.opacity = '0';
    });
  }
  
  // Run immediately and after a small delay
  quickHide();
  setTimeout(quickHide, 1);
})();

// Main plugin initialization on window.onload
window.onload = function() {
  console.info('🚀 SquareHero.store Portfolio Summary Block plugin by SquareHero.store loaded');
  
  // Hide placeholders again
  hideAllPlaceholders();
  
  // Read configuration from meta tag
  const config = getConfigFromMetaTag();
  
  // Exit if plugin is not enabled
  if (!config.enabled) {
    console.log('Portfolio Summary Block Adapter: Plugin is disabled');
    return;
  }
  
  // Define the portfolio JSON endpoint based on target
  const PORTFOLIO_JSON_URL = `/${config.target}?format=json`;
  console.log(`Portfolio Summary Block Adapter: Using endpoint ${PORTFOLIO_JSON_URL}`);
  
  // Initialize the portfolio blocks
  initPortfolioSummaryBlocks();
  
  // Add another initialization with delay for any delayed DOM elements
  setTimeout(initPortfolioSummaryBlocks, 1000);
  
  // Function to hide all placeholders
  function hideAllPlaceholders() {
    const placeholders = document.querySelectorAll('.sqs-block-summary-v2 .sqs-block-is-placeholder');
    placeholders.forEach(placeholder => {
      placeholder.style.visibility = 'hidden';
      placeholder.style.opacity = '0';
    });
  }
  
  // Function to get configuration from meta tag
  function getConfigFromMetaTag() {
    const metaTag = document.querySelector('meta[squarehero-plugin="portfolio-summary-block"]');
    
    if (!metaTag) {
      return {
        enabled: false,
        target: 'portfolio',
        blockId: null
      };
    }
    
    return {
      enabled: metaTag.getAttribute('enabled') === 'true',
      target: metaTag.getAttribute('target') || 'portfolio',
      blockId: metaTag.getAttribute('block-id') || null
    };
  }
  
  // Function to initialize portfolio summary blocks
  function initPortfolioSummaryBlocks() {
    // Find all summary blocks that are placeholders
    let summaryBlocks;
    
    if (config.blockId) {
      // Target specific block by ID
      summaryBlocks = document.querySelectorAll(`#${config.blockId}.sqs-block-summary-v2`);
    } else {
      // Target all placeholder blocks
      summaryBlocks = document.querySelectorAll('.sqs-block-summary-v2');
    }
    
    console.log(`Portfolio Summary Block Adapter: Found ${summaryBlocks.length} summary blocks`);
    
    summaryBlocks.forEach(function(block) {
      // Check if this is a placeholder block
      const blockStatusElement = block.querySelector('.sqs-blockStatus');
      const wrapper = block.querySelector('.summary-block-wrapper');
      const isPlaceholder = blockStatusElement || 
                          (wrapper && wrapper.classList.contains('sqs-block-is-placeholder'));
      
      if (!isPlaceholder) {
        console.log('Not a placeholder block, skipping');
        return;
      }
      
      // Extract the block configuration
      const blockJsonAttr = block.getAttribute('data-block-json');
      if (!blockJsonAttr) return;
      
      try {
        // Parse the JSON configuration
        const blockConfig = JSON.parse(blockJsonAttr);
        
        // Get the wrapper
        if (!wrapper) return;
        
        // Create loader container
        const loaderContainer = document.createElement('div');
        loaderContainer.className = 'portfolio-adapter-loader';
        
        // Add loading spinner inside the container
        const spinner = document.createElement('div');
        spinner.className = 'portfolio-adapter-loading-spinner';
        loaderContainer.appendChild(spinner);
        
        // Add the loader container to the block (not the wrapper)
        block.appendChild(loaderContainer);
        
        // Keep wrapper hidden
        wrapper.style.visibility = 'hidden';
        wrapper.style.opacity = '0';
        wrapper.classList.add('portfolio-adapter-loading');
        
        // Remove placeholder classes
        wrapper.classList.remove('sqs-block-is-placeholder');
        
        // Remove the blockStatus element (the placeholder message)
        if (blockStatusElement) {
          blockStatusElement.remove();
        }
        
        // Add proper collection type class
        wrapper.classList.remove('summary-block-collection-type-generic');
        wrapper.classList.add('summary-block-collection-type-portfolio');
        
        // Fetch and render portfolio items
        fetchPortfolioItems()
          .then(items => {
            renderPortfolioItems(wrapper, items, blockConfig);
            
            // Create a counter to track image loading
            let totalImages = 0;
            let loadedImages = 0;
            
            // Count all thumbnail images
            const thumbnailImages = wrapper.querySelectorAll('.summary-thumbnail-image');
            totalImages = thumbnailImages.length;
            
            if (totalImages === 0) {
              // No images to load, show content immediately
              finishLoading();
            } else {
              // Set up image load tracking
              thumbnailImages.forEach(img => {
                // Mark parent as loading
                const itemElement = img.closest('.summary-item');
                if (itemElement) {
                  itemElement.classList.add('portfolio-adapter-item-loading');
                }
                
                // Check if already loaded
                if (img.complete && img.naturalWidth) {
                  imageLoaded(img);
                } else {
                  // Set up load and error handlers
                  img.onload = function() {
                    imageLoaded(img);
                  };
                  
                  img.onerror = function() {
                    // Count error as loaded to avoid hanging
                    imageLoaded(img);
                  };
                  
                  // Set src to trigger loading if not already set
                  if (!img.src) {
                    const dataSrc = img.getAttribute('data-src');
                    if (dataSrc) {
                      img.src = dataSrc;
                    }
                  }
                }
              });
              
              // Set a maximum wait time in case some images never load
              setTimeout(finishLoading, 3000);
            }
            
            function imageLoaded(img) {
              // Mark image as loaded
              img.classList.add('loaded');
              
              // Mark parent item as ready
              const itemElement = img.closest('.summary-item');
              if (itemElement) {
                itemElement.classList.remove('portfolio-adapter-item-loading');
                itemElement.classList.add('portfolio-adapter-item-ready');
              }
              
              // Increment counter
              loadedImages++;
              
              // Check if all images are loaded
              if (loadedImages >= totalImages) {
                finishLoading();
              }
            }
            
            function finishLoading() {
              // Fix layout issues first
              fixLayoutAfterRender(wrapper, blockConfig);
              
              // Short delay to allow layout fixes to complete
              setTimeout(() => {
                // Add ready class to wrapper for transition
                wrapper.classList.add('portfolio-content-ready');
                
                // Make wrapper visible
                wrapper.style.visibility = 'visible';
                wrapper.style.opacity = '1';
                
                // Begin removing the loader with fade out
                if (loaderContainer) {
                  loaderContainer.style.opacity = '0';
                  
                  // Remove loader after fade completes
                  setTimeout(() => {
                    if (loaderContainer && loaderContainer.parentNode) {
                      loaderContainer.parentNode.removeChild(loaderContainer);
                    }
                  }, 300);
                }
                
                // Log success message
                console.log('🚀 SquareHero.store Portfolio Summary Block plugin loaded and rendered');
              }, 100);
            }
          })
          .catch(error => {
            console.error('Error fetching portfolio items:', error);
            
            // Show error state and remove loader
            if (loaderContainer && loaderContainer.parentNode) {
              loaderContainer.parentNode.removeChild(loaderContainer);
            }
            
            // Still show content even on error
            wrapper.style.visibility = 'visible';
            wrapper.style.opacity = '1';
          });
      } catch (e) {
        console.error('Error parsing or updating summary block:', e);
      }
    });
  }
  
  // Function to fix layout issues after rendering
  function fixLayoutAfterRender(wrapper, config) {
    // Get the itemList and items
    const itemList = wrapper.querySelector('.summary-item-list');
    const items = itemList?.querySelectorAll('.summary-item');
    
    if (!itemList || !items || items.length === 0) return;
    
    // For grid layouts - add active classes
    if (config.design === 'grid' || config.design === 'autogrid') {
      // Apply active slide classes to all items in grid for proper rendering
      items.forEach(item => {
        if (!item.classList.contains('sqs-active-slide')) {
          item.classList.add('sqs-active-slide');
        }
      });
      
      // Fix the container classes if needed
      if (!itemList.classList.contains('summary-item-list-grid')) {
        itemList.classList.add('summary-item-list-grid');
      }
    } else if (config.design === 'carousel') {
      // Make sure carousel-specific classes are applied
      itemList.classList.add('summary-carousel-container');
      
      // For carousels, only first visible items should be active
      const slidesPerView = config.slidesPerRow || 3;
      items.forEach((item, index) => {
        if (index < slidesPerView) {
          item.classList.add('sqs-active-slide');
        } else if (item.classList.contains('sqs-active-slide')) {
          item.classList.remove('sqs-active-slide');
        }
      });
      
      // Try to initialize with Squarespace native methods if available
      if (window.Squarespace && window.Squarespace.initializeCarousel) {
        setTimeout(() => {
          try {
            window.Squarespace.initializeCarousel(itemList);
          } catch (e) {
            console.warn('Could not initialize carousel with Squarespace native methods:', e);
          }
        }, 100);
      }
    }
    
    // Force a reflow of the layout
    itemList.style.display = 'none';
    setTimeout(() => {
      itemList.style.display = '';
    }, 10);
    
    // Trigger Squarespace's image resizing
    setTimeout(() => {
      triggerSquarespaceImageResize(wrapper);
    }, 100);
  }
  
  function triggerSquarespaceImageResize(wrapper) {
    console.log('Triggering Squarespace image resize for adapted block');
    
    const summaryImages = wrapper.querySelectorAll('.summary-thumbnail-image');
    console.log(`Repositioning ${summaryImages.length} summary images`);
    
    summaryImages.forEach(img => {
      // Find the parent container
      const container = img.closest('.summary-thumbnail');
      if (!container) return;
      
      // Force absolute positioning with object-fit cover
      img.style.position = 'absolute';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.style.top = '0';
      img.style.left = '0';
      
      // Make sure the loaded class is applied
      img.classList.add('loaded');
    });
    
    // Global resize trigger
    window.dispatchEvent(new Event('resize'));
    
    // Try to use Squarespace's YUI resize emitter if available
    if (window.Squarespace && window.Squarespace._resizeEmitter) {
      try {
        // Try firing the event - this is using YUI's custom event system
        if (typeof window.Squarespace._resizeEmitter.fire === 'function') {
          window.Squarespace._resizeEmitter.fire('resize');
        }
        // Also try publishing the event
        if (typeof window.Squarespace._resizeEmitter.publish === 'function') {
          window.Squarespace._resizeEmitter.publish('resize', { broadcast: true });
        }
      } catch (e) {
        console.warn('Error triggering Squarespace resize emitter:', e);
      }
    }
    
    // Try Squarespace's initialization methods as a backup
    if (window.Squarespace) {
      const methods = [
        'initializeImageBlockDynamicElements',
        'AFTER_IMAGE_LOAD_CALLBACK'
      ];
      
      methods.forEach(method => {
        if (typeof window.Squarespace[method] === 'function') {
          try {
            window.Squarespace[method]();
          } catch (e) {
            // Silently catch errors
          }
        }
      });
    }
  }
  
  // Function to fetch portfolio items from the configured JSON endpoint
  function fetchPortfolioItems() {
    return fetch(PORTFOLIO_JSON_URL)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch portfolio items from ${PORTFOLIO_JSON_URL}`);
        }
        return response.json();
      })
      .then(data => {
        // Extract items from the response
        if (data && data.items) {
          console.log(`Portfolio Summary Block Adapter: Fetched ${data.items.length} items`);
          return data.items;
        } else {
          console.warn('Portfolio JSON response does not contain items array:', data);
          return [];
        }
      });
  }
  
  // Function to render portfolio items in the summary block
  function renderPortfolioItems(wrapper, items, config) {
    // Find the item list
    const itemList = wrapper.querySelector('.summary-item-list');
    if (!itemList) {
      console.error('Item list not found');
      return;
    }
    
    // Get existing template items (we'll use these as templates)
    const templateItems = Array.from(itemList.querySelectorAll('.summary-item'));
    if (templateItems.length === 0) {
      console.error('No template items found');
      return;
    }
    
    // Save a deep copy of the first template item for later use
    const firstTemplateHTML = templateItems[0].outerHTML;
    
    // Save the original styles and attributes before clearing
    const originalItemStyles = {};
    templateItems[0].getAttributeNames().forEach(attr => {
      originalItemStyles[attr] = templateItems[0].getAttribute(attr);
    });
    
    // Capture original margin and padding from computed style
    const computedStyle = window.getComputedStyle(templateItems[0]);
    const originalItemWidth = templateItems[0].style.width || computedStyle.width;
    const originalItemPadding = {
      left: templateItems[0].style.paddingLeft || computedStyle.paddingLeft,
      right: templateItems[0].style.paddingRight || computedStyle.paddingRight
    };
    
    // Save the original classes of the template item
    const originalItemClasses = Array.from(templateItems[0].classList);
    
    // Save gallery styles and attributes
    const originalGalleryStyles = {};
    const originalWidth = itemList.style.width;
    const originalMargin = itemList.style.marginLeft;
    itemList.getAttributeNames().forEach(attr => {
      originalGalleryStyles[attr] = itemList.getAttribute(attr);
    });
    
    // Determine settings based on design type
    const isCarousel = config.design === 'carousel';
    const isGrid = config.design === 'grid' || config.design === 'autogrid';
    const slidesPerRow = config.slidesPerRow || (isCarousel ? 3 : 1);
    
    // Save the active classes
    const activeClasses = [];
    templateItems.forEach((item, index) => {
      if (item.classList.contains('sqs-active-slide')) {
        activeClasses.push(index);
      }
    });
    
    // Check if any template items have active class
    const hasActiveItems = templateItems.some(item => item.classList.contains('sqs-active-slide'));
    
    // Save original list classes
    const originalListClasses = Array.from(itemList.classList);
    
    // Clear existing placeholder items
    itemList.innerHTML = '';
    
    // Restore gallery styles and attributes
    Object.keys(originalGalleryStyles).forEach(attr => {
      // Skip certain attributes to avoid conflicts
      if (!['id', 'class'].includes(attr)) {
        itemList.setAttribute(attr, originalGalleryStyles[attr]);
      }
    });
    
    // Restore original classes from the itemList
    originalListClasses.forEach(cls => {
      itemList.classList.add(cls);
    });
    
    // Restore original width and margin
    if (originalWidth) itemList.style.width = originalWidth;
    if (originalMargin) itemList.style.marginLeft = originalMargin;
    
    // Limit items to the pageSize
    const itemsToShow = items.slice(0, config.pageSize || 30);
    
    // For each portfolio item, create a summary item based on the template
    itemsToShow.forEach((portfolioItem, index) => {
      // Create a new item from the template
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = firstTemplateHTML;
      const newItem = tempDiv.firstChild;
      
      // Restore all original attributes
      Object.keys(originalItemStyles).forEach(attr => {
        if (attr !== 'id' && attr !== 'class') {
          newItem.setAttribute(attr, originalItemStyles[attr]);
        }
      });
      
      // Restore original item classes
      originalItemClasses.forEach(cls => {
        if (!newItem.classList.contains(cls)) {
          newItem.classList.add(cls);
        }
      });
      
      // Keep the width for grid items as in the original
      if (originalItemWidth) newItem.style.width = originalItemWidth;
      if (originalItemPadding.left) newItem.style.paddingLeft = originalItemPadding.left;
      if (originalItemPadding.right) newItem.style.paddingRight = originalItemPadding.right;
      
      // Update content with portfolio item data
      updateSummaryItemContent(newItem, portfolioItem);
      
      // Add to the list
      itemList.appendChild(newItem);
      
      // Add active slide classes for proper rendering
      if (isGrid) {
        // For grid and autogrid, make sure all items have active class
        newItem.classList.add('sqs-active-slide');
      } else if (isCarousel) {
        // For carousel, only add active class to items that should be initially visible
        if (index < slidesPerRow || (hasActiveItems && activeClasses.includes(index % templateItems.length))) {
          newItem.classList.add('sqs-active-slide');
        }
      }
    });
    
    // Fix carousel navigation for correct item count
    if (isCarousel) {
      setTimeout(() => {
        fixCarouselNavigation(wrapper, slidesPerRow, itemsToShow.length);
      }, 100);
    }
  }
  
  // Function to update a summary item with portfolio data
  function updateSummaryItemContent(itemElement, portfolioItem) {
    // Update thumbnail
    if (portfolioItem.assetUrl) {
      const thumbnailImg = itemElement.querySelector('.summary-thumbnail-image');
      if (thumbnailImg) {
        // Remove loaded class initially
        thumbnailImg.classList.remove('loaded');
        
        // Set image source - use data-src as a placeholder and actual src for loading
        thumbnailImg.setAttribute('data-src', portfolioItem.assetUrl);
        thumbnailImg.setAttribute('data-image', portfolioItem.assetUrl);
        thumbnailImg.setAttribute('alt', portfolioItem.title || '');
        thumbnailImg.src = `${portfolioItem.assetUrl}?format=750w`;
        
        // Set image dimensions if available
        if (portfolioItem.originalSize) {
          thumbnailImg.setAttribute('data-image-dimensions', 
            `${portfolioItem.originalSize.width}x${portfolioItem.originalSize.height}`);
        }
      }
      
      const thumbnailLink = itemElement.querySelector('.summary-thumbnail-container');
      if (thumbnailLink) {
        thumbnailLink.href = portfolioItem.fullUrl || '';
        thumbnailLink.setAttribute('data-title', portfolioItem.title || '');
      }
    }
    
    // Update title
    const titleLink = itemElement.querySelector('.summary-title-link');
    if (titleLink) {
      titleLink.textContent = portfolioItem.title || 'Untitled';
      titleLink.href = portfolioItem.fullUrl || '';
    }
    
    // Handle excerpt - use SEO description if available
    const excerptElem = itemElement.querySelector('.summary-excerpt');
    if (excerptElem) {
      if (portfolioItem.seoData && portfolioItem.seoData.seoDescription) {
        // If there's a paragraph element, update its content, otherwise create one
        const p = excerptElem.querySelector('p') || document.createElement('p');
        p.textContent = portfolioItem.seoData.seoDescription;
        
        if (!excerptElem.querySelector('p')) {
          excerptElem.appendChild(p);
        }
        
        // Make sure the excerpt is visible
        excerptElem.style.display = '';
      } else {
        // No SEO description, hide the excerpt
        excerptElem.style.display = 'none';
      }
    }
    
    // Remove date elements if they exist
    const dateElements = itemElement.querySelectorAll('.summary-metadata-item--date');
    dateElements.forEach(dateElem => {
      if (dateElem.parentNode) {
        dateElem.parentNode.removeChild(dateElem);
      }
    });
  }
  
  // Function to fix carousel navigation
  function fixCarouselNavigation(wrapper, slidesPerView, totalItems) {
    const nextBtn = wrapper.querySelector('.summary-carousel-pager-next');
    const prevBtn = wrapper.querySelector('.summary-carousel-pager-prev');
    const gallery = wrapper.querySelector('.sqs-gallery');
    
    if (!nextBtn || !prevBtn || !gallery) return;
    
    // Calculate max position
    const maxPosition = Math.max(0, Math.ceil(totalItems / slidesPerView) - 1);
    
    // Store the maxPosition on the gallery element for reference during resize
    gallery.dataset.maxPosition = maxPosition;
    gallery.dataset.slidesPerView = slidesPerView;
    
    // If there's only one screen of items, disable the next button
    if (maxPosition === 0) {
      nextBtn.classList.add('sqs-disabled');
      nextBtn.setAttribute('aria-disabled', 'true');
    }
    
    // Initially disable prev button and make sure it stays disabled at position 0
    prevBtn.classList.add('sqs-disabled');
    prevBtn.setAttribute('aria-disabled', 'true');
    
    // Function to update button states based on current position
    const updateButtonStates = () => {
      const transform = gallery.style.transform || '';
      const match = transform.match(/translateX\(-(\d+(?:\.\d+)?)%\)/);
      
      if (match) {
        const currentPos = Math.round(parseFloat(match[1]) / 100);
        
        // Store current position for reference
        gallery.dataset.currentPosition = currentPos;
        
        // Update button states based on current position
        if (currentPos <= 0) {
          prevBtn.classList.add('sqs-disabled');
          prevBtn.setAttribute('aria-disabled', 'true');
          
          // Only enable next if we have more than one screen
          if (maxPosition > 0) {
            nextBtn.classList.remove('sqs-disabled');
            nextBtn.setAttribute('aria-disabled', 'false');
          }
        } else if (currentPos >= maxPosition) {
          nextBtn.classList.add('sqs-disabled');
          nextBtn.setAttribute('aria-disabled', 'true');
          prevBtn.classList.remove('sqs-disabled');
          prevBtn.setAttribute('aria-disabled', 'false');
        } else {
          prevBtn.classList.remove('sqs-disabled');
          prevBtn.setAttribute('aria-disabled', 'false');
          nextBtn.classList.remove('sqs-disabled');
          nextBtn.setAttribute('aria-disabled', 'false');
        }
      }
    };
    
    // Prevent clicks on disabled next button
    nextBtn.addEventListener('click', function(e) {
      if (nextBtn.classList.contains('sqs-disabled')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      
      // Get current transform position
      setTimeout(updateButtonStates, 50);
    }, true);
    
    // Prevent clicks on disabled prev button
    prevBtn.addEventListener('click', function(e) {
      if (prevBtn.classList.contains('sqs-disabled')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      
      // Get current transform position
      setTimeout(updateButtonStates, 50);
    }, true);
    
    // Add global event listener for transform changes
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          updateButtonStates();
        }
      }
    });
    
    observer.observe(gallery, { attributes: true });
    
    // Add window resize handler to maintain correct button states
    const resizeHandler = () => {
      // After resize, check if we need to adjust the navigation state
      setTimeout(() => {
        // Read stored maxPosition
        const storedMaxPosition = parseInt(gallery.dataset.maxPosition || '0', 10);
        
        // Read current position
        const currentPos = parseInt(gallery.dataset.currentPosition || '0', 10);
        
        // Reset button states correctly based on stored position
        if (currentPos <= 0) {
          prevBtn.classList.add('sqs-disabled');
          prevBtn.setAttribute('aria-disabled', 'true');
          
          if (storedMaxPosition > 0) {
            nextBtn.classList.remove('sqs-disabled');
            nextBtn.setAttribute('aria-disabled', 'false');
          } else {
            nextBtn.classList.add('sqs-disabled');
            nextBtn.setAttribute('aria-disabled', 'true');
          }
        } else if (currentPos >= storedMaxPosition) {
          nextBtn.classList.add('sqs-disabled');
          nextBtn.setAttribute('aria-disabled', 'true');
          prevBtn.classList.remove('sqs-disabled');
          prevBtn.setAttribute('aria-disabled', 'false');
        }
      }, 200);
    };
    
    // Attach resize handler
    window.addEventListener('resize', resizeHandler);
    
    // Store cleanup function on wrapper for potential future use
    wrapper._cleanupCarouselNavigation = () => {
      window.removeEventListener('resize', resizeHandler);
      observer.disconnect();
    };
  }
};