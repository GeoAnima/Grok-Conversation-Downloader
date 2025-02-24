# Grok Conversation Downloader

A UserScript to download Grok conversations as JSON or PDF.

## Installation

1. Ensure you have a UserScript manager like [Tampermonkey](https://www.tampermonkey.net/) or [Greasemonkey](https://www.greasespot.net/) installed in your browser.
2. Click the "Raw" button on the [script's GitHub page](https://github.com/GeoAnima/Grok-Conversation-Downloader/raw/main/grok-conversation-downloader.user.js) to install the script automatically.

## Usage

Once installed, the script adds "Download JSON" and "Download PDF" buttons next to the "New Chat" button on the Grok website. Click these buttons to download the current conversation in the respective format.

## Dependencies

This script relies on the following external libraries:
- [Marked.js](https://cdn.jsdelivr.net/npm/marked@4.0.0/lib/marked.min.js) (for Markdown parsing)
- [PDFKit](https://cdn.jsdelivr.net/npm/pdfkit@0.16.0/js/pdfkit.standalone.js) (for PDF generation)
- [Blob Stream](https://cdn.jsdelivr.net/npm/blob-stream@0.1.3/.js) (for handling blobs in PDF generation)

These are automatically loaded via `@require` in the UserScript header.

## License

This script is published under the [MIT License](LICENSE).
