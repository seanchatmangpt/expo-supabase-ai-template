import puppeteer from 'puppeteer';

(async () => {
  try {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({ 
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    const page = await browser.newPage();
    
    // Mobile viewport with short height to force scrolling
    await page.setViewport({ width: 375, height: 400 });

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

    console.log('Navigating to http://localhost:8081 ...');
    await page.goto('http://localhost:8081', { waitUntil: 'networkidle0', timeout: 60000 });
    
    console.log('Waiting for initial render...');
    // Await for something to appear, maybe wait a bit to ensure animations finish
    await new Promise(resolve => setTimeout(resolve, 3000));

    await page.screenshot({ path: 'scroll_test_before.png' });
    console.log('Captured scroll_test_before.png');

    console.log('Analyzing scrollable elements...');
    const scrollInfo = await page.evaluate(() => {
      const divs = Array.from(document.querySelectorAll('div'));
      const debugInfo = divs.map(el => {
         const style = window.getComputedStyle(el);
         return {
            className: el.className,
            scrollHeight: el.scrollHeight,
            clientHeight: el.clientHeight,
            overflowY: style.overflowY,
            isScrollable: el.scrollHeight > el.clientHeight
         };
      }).filter(info => info.isScrollable || info.overflowY === 'auto' || info.overflowY === 'scroll');
      
      const getScrollableElements = () => {
          return Array.from(document.querySelectorAll('*')).filter(el => {
              const hasScrollableContent = Math.floor(el.scrollHeight) > Math.ceil(el.clientHeight);
              const overflowYStyle = window.getComputedStyle(el).overflowY;
              const isOverflowHidden = overflowYStyle.indexOf('hidden') !== -1;
              const isAutoOrScroll = overflowYStyle === 'auto' || overflowYStyle === 'scroll';
              return hasScrollableContent && isAutoOrScroll;
          });
      };

      const scrollables = getScrollableElements();
      
      if (scrollables.length > 0) {
          const el = scrollables[0];
          const initialScrollTop = el.scrollTop;
          
          // Actually try to scroll it
          el.scrollBy({ top: 300, behavior: 'auto' });
          
          return {
              success: true,
              elementTag: el.tagName,
              elementClass: el.className,
              scrollHeight: el.scrollHeight,
              clientHeight: el.clientHeight,
              initialScrollTop: initialScrollTop,
              newScrollTop: el.scrollTop,
              debug: debugInfo
          };
      }
      
      return { 
        success: false,
        debug: debugInfo
      };
    });

    console.log('Scroll Simulation Result:', scrollInfo);
    
    // Wait for scroll to settle
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await page.screenshot({ path: 'scroll_test_after.png' });
    console.log('Captured scroll_test_after.png');
    
    if (scrollInfo.success && scrollInfo.initialScrollTop !== scrollInfo.newScrollTop) {
        console.log('✅ UI Scrolling successfully validated!');
    } else {
        console.log('❌ UI Scrolling failed or no scrollable content found.');
    }

    await browser.close();
  } catch (err) {
    console.error('Error during simulation:', err);
    process.exit(1);
  }
})();
