# SplitLens
An offline data analytics website for detecting Simpson’s paradox and testing the predictive value of audience segments. Built with JavaScript, HTML and CSS.

## Run
Extract the entire ZIP. Open SplitLens/index.html in your browser. It starts with a synthetic campaign dataset. Use Open CSV to try your own records; data stays in your browser.

## Demo walkthrough
Compare campaign A with B using Converted as the outcome and Audience as the segment. Campaign A converts 74% overall versus 36% for B. B leads among returning visitors (90% versus 80%) and new visitors (30% versus 20%). A received more returning visitors. Giving both campaigns the pooled audience mix yields a 10-percentage-point advantage for B.

## Model and evaluation
engine.js implements CSV parsing, segment comparisons and a categorical mean regression model. The predictor learns an outcome mean per segment. Each row is predicted after excluding it from training. A segment with no other observation uses the training mean. Error reduction is one minus the ratio of squared errors to the leave-one-out global-mean baseline. The app reports unavailable when the baseline has zero error. This metric describes predictive association; it does not estimate campaign impact. Rare segments can give unstable comparisons.

## Input
Use a comma-delimited UTF-8 CSV under 3 MB with headers. Each row should represent one observation, with a two-category comparison column, numeric outcome and categorical segment. Empty analysis fields and nonnumeric outcomes are excluded. Binary outcomes are displayed as rates. The included campaign-demo.csv can be edited and reloaded.

## Upload to GitHub
Upload the contents of the extracted SplitLens folder to the root of your repository, keeping all files together.
