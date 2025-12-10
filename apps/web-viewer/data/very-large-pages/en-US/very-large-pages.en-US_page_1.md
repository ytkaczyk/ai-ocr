# Very Large Page Test

This document tests the application's ability to handle extremely large PDF pages without freezing or becoming unresponsive.

## Test Scenario

This page simulates a very large document (20000x20000 pixels) to verify that:
- The application remains responsive
- Navigation controls remain functional
- The page renders without crashing the browser
- Zoom controls work correctly

## Technical Details

Large pages can occur in real-world scenarios such as:
- Architectural blueprints
- Engineering diagrams
- Large-format posters
- High-resolution scans

The application should gracefully handle these edge cases while maintaining performance and user experience.
