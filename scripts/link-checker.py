#!/usr/bin/env python3
"""
AetherRun Link Checker Script
Crawls the deployed application and reports broken links (404 errors).
"""

import requests
import time
import re
from urllib.parse import urljoin, urlparse, parse_qs
from collections import deque
import json
from datetime import datetime
import argparse
import sys

class LinkChecker:
    def __init__(self, base_url, max_pages=50, delay=1):
        self.base_url = base_url.rstrip('/')
        self.max_pages = max_pages
        self.delay = delay
        self.visited = set()
        self.to_visit = deque([base_url])
        self.broken_links = []
        self.valid_links = []
        self.session = requests.Session()
        
        # Set headers to mimic a real browser
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
        })
    
    def is_valid_url(self, url):
        """Check if URL is valid and belongs to our domain"""
        try:
            parsed = urlparse(url)
            base_parsed = urlparse(self.base_url)
            
            # Only check URLs from the same domain
            if parsed.netloc and parsed.netloc != base_parsed.netloc:
                return False
            
            # Skip non-HTTP(S) protocols
            if parsed.scheme and parsed.scheme not in ['http', 'https']:
                return False
            
            # Skip common file extensions that aren't web pages
            skip_extensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', 
                             '.css', '.js', '.pdf', '.zip', '.exe', '.dmg']
            if any(url.lower().endswith(ext) for ext in skip_extensions):
                return False
            
            # Skip fragments and query parameters for crawling purposes
            clean_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
            return clean_url not in self.visited
            
        except Exception:
            return False
    
    def extract_links(self, html_content, current_url):
        """Extract all links from HTML content"""
        links = set()
        
        # Find all href attributes
        href_pattern = r'href=["\']([^"\']+)["\']'
        for match in re.finditer(href_pattern, html_content, re.IGNORECASE):
            link = match.group(1)
            full_url = urljoin(current_url, link)
            if self.is_valid_url(full_url):
                # Remove fragments and query parameters for crawling
                parsed = urlparse(full_url)
                clean_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
                links.add(clean_url)
        
        # Find all src attributes (for images, scripts, etc.)
        src_pattern = r'src=["\']([^"\']+)["\']'
        for match in re.finditer(src_pattern, html_content, re.IGNORECASE):
            link = match.group(1)
            full_url = urljoin(current_url, link)
            if full_url.startswith(self.base_url):
                links.add(full_url)
        
        return links
    
    def check_url(self, url):
        """Check a single URL and return status information"""
        try:
            print(f"Checking: {url}")
            response = self.session.get(url, timeout=10, allow_redirects=True)
            
            return {
                'url': url,
                'status_code': response.status_code,
                'response_time': response.elapsed.total_seconds(),
                'final_url': response.url,
                'content_type': response.headers.get('content-type', ''),
                'error': None
            }
        except requests.exceptions.RequestException as e:
            return {
                'url': url,
                'status_code': None,
                'response_time': None,
                'final_url': None,
                'content_type': None,
                'error': str(e)
            }
    
    def crawl(self):
        """Main crawling function"""
        print(f"Starting link check for: {self.base_url}")
        print(f"Max pages to check: {self.max_pages}")
        print("-" * 50)
        
        pages_checked = 0
        
        while self.to_visit and pages_checked < self.max_pages:
            current_url = self.to_visit.popleft()
            
            if current_url in self.visited:
                continue
            
            self.visited.add(current_url)
            pages_checked += 1
            
            # Check the current URL
            result = self.check_url(current_url)
            
            if result['error']:
                self.broken_links.append({
                    **result,
                    'issue': f"Connection error: {result['error']}"
                })
                print(f"❌ ERROR: {current_url} - {result['error']}")
            elif result['status_code'] >= 400:
                self.broken_links.append({
                    **result,
                    'issue': f"HTTP {result['status_code']} error"
                })
                print(f"❌ BROKEN: {current_url} - HTTP {result['status_code']}")
            else:
                self.valid_links.append(result)
                print(f"✅ OK: {current_url} - HTTP {result['status_code']}")
                
                # Extract links only from HTML pages
                if (result['content_type'] and 
                    'text/html' in result['content_type'] and 
                    result['status_code'] == 200):
                    try:
                        response = self.session.get(current_url)
                        links = self.extract_links(response.text, current_url)
                        for link in links:
                            if link not in self.visited:
                                self.to_visit.append(link)
                    except Exception as e:
                        print(f"⚠️  Could not extract links from {current_url}: {e}")
            
            # Rate limiting
            time.sleep(self.delay)
        
        print("-" * 50)
        print(f"Crawling completed. Checked {pages_checked} pages.")
    
    def generate_report(self):
        """Generate a comprehensive report"""
        report = {
            'scan_info': {
                'base_url': self.base_url,
                'timestamp': datetime.now().isoformat(),
                'total_pages_checked': len(self.visited),
                'total_links_found': len(self.valid_links) + len(self.broken_links)
            },
            'summary': {
                'valid_links': len(self.valid_links),
                'broken_links': len(self.broken_links),
                'success_rate': (len(self.valid_links) / (len(self.valid_links) + len(self.broken_links))) * 100 if (len(self.valid_links) + len(self.broken_links)) > 0 else 0
            },
            'broken_links': self.broken_links,
            'valid_links': self.valid_links
        }
        
        return report
    
    def print_summary(self):
        """Print a summary of the link check results"""
        total_links = len(self.valid_links) + len(self.broken_links)
        
        print(f"\n{'='*60}")
        print("LINK CHECK SUMMARY")
        print(f"{'='*60}")
        print(f"Base URL: {self.base_url}")
        print(f"Total pages checked: {len(self.visited)}")
        print(f"Total links found: {total_links}")
        print(f"Valid links: {len(self.valid_links)}")
        print(f"Broken links: {len(self.broken_links)}")
        
        if total_links > 0:
            success_rate = (len(self.valid_links) / total_links) * 100
            print(f"Success rate: {success_rate:.1f}%")
        
        if self.broken_links:
            print(f"\n{'='*60}")
            print("BROKEN LINKS DETAILS")
            print(f"{'='*60}")
            for link in self.broken_links:
                print(f"\n❌ {link['url']}")
                print(f"   Issue: {link['issue']}")
                if link['status_code']:
                    print(f"   Status Code: {link['status_code']}")
        else:
            print(f"\n🎉 No broken links found!")

def main():
    parser = argparse.ArgumentParser(description='Check for broken links in AetherRun application')
    parser.add_argument('url', help='Base URL to check (e.g., https://your-app.replit.app)')
    parser.add_argument('--max-pages', type=int, default=50, help='Maximum pages to check (default: 50)')
    parser.add_argument('--delay', type=float, default=1, help='Delay between requests in seconds (default: 1)')
    parser.add_argument('--output', help='Output file for detailed JSON report')
    
    args = parser.parse_args()
    
    # Validate URL
    if not args.url.startswith(('http://', 'https://')):
        print("Error: URL must start with http:// or https://")
        sys.exit(1)
    
    # Run the link checker
    checker = LinkChecker(args.url, args.max_pages, args.delay)
    
    try:
        checker.crawl()
        checker.print_summary()
        
        # Save detailed report if requested
        if args.output:
            report = checker.generate_report()
            with open(args.output, 'w') as f:
                json.dump(report, f, indent=2)
            print(f"\nDetailed report saved to: {args.output}")
    
    except KeyboardInterrupt:
        print("\n\nLink check interrupted by user.")
        checker.print_summary()
    except Exception as e:
        print(f"\nError during link checking: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()