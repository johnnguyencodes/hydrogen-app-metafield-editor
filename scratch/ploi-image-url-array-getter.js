// Paste lines 11 - 19 in the console log of ploi.me on a plant details page to get an array of urls
// Open sublime and convert the array into a list of url strings, one string per line. Do not edit URL, it needs to be the full AWS URL with URL parameters
// Open WFDownloader, click Tasks > Batch download links from clipboard or file
// Enter plant handle as batch name
// Save to Downloads/Ploi Downloads/plant-handle
// Save job, then click "Start" to initiate job
// Once downloded, move image out of subfolders in order by number
// Then, visit this github ticket on image processing instructions https://github.com/users/johnnguyencodes/projects/7?query=sort%3Aupdated-desc+is%3Aopen&pane=issue&itemId=111235962&issue=johnnguyencodes%7Chydrogen-app%7C68

// Grab all <a class="thumb"> elements
const thumbs = document.querySelectorAll("a.thumb");

// Extract their hrefs into an array
const hrefs = Array.from(thumbs).map((el) => el.getAttribute("href"));

// Log them to the console
console.log(hrefs);

// (Optional) Copy the list to your clipboard, one URL per line:
copy(hrefs.join("\n"));
// output ['https://ploi-plant-care.s3.amazonaws.com/shrine/ph…fb845cfd51bc74838c9747d3a71cf0f0dd0599e2ac72ac804', 'https://ploi-plant-care.s3.amazonaws.com/shrine/ph…2d471bdc88df232e5a5dcb352e995089753a3aeda8ecf8d38', 'https://ploi-plant-care.s3.amazonaws.com/shrine/ph…c1d31555dbc01c73d6f3d5170374509b24710c470671f983f', 'https://ploi-plant-care.s3.amazonaws.com/shrine/ph…b6c11d244385665fec4099d37c99a5b4b078a82805d6955fe', 'https://ploi-plant-care.s3.amazonaws.com/shrine/ph…5f0fd21ede8095b8843ef74da77e1e2a6fb8927a3d4193742', 'https://ploi-plant-care.s3.amazonaws.com/shrine/ph…39209cd8486934f86229a4cb722ae71553692b8dabab9579a', 'https://ploi-plant-care.s3.amazonaws.com/shrine/ph…0df7ce9c10102ce08f48d96a14338f6d93b146944c41a27b5', 'https://ploi-plant-care.s3.amazonaws.com/shrine/ph…3f2222975a0ddd38193e3129fd89ecea98ddc2eb237ed5c7b', 'https://ploi-plant-care.s3.amazonaws.com/shrine/ph…1298325941fbd096b3a20b7f87b801faeb8e5882ed5ca6ecd', 'https://ploi-plant-care.s3.amazonaws.com/shrine/ph…ebedbc4121a57cd675d0d8bf8f2ef8941b69c41ca2337ba4b', 'https://ploi-plant-care.s3.amazonaws.com/shrine/ph…c40184b6bb36b9880d72e5dbfb02c465f5656bbad370830c0', 'https://ploi-plant-care.s3.amazonaws.com/shrine/ph…118aaee5b1963802dbb942e0022348081c3f2ccd6adc2e2a3', 'https://ploi-plant-care.s3.amazonaws.com/shrine/ph…a97a846f749cf780d578cc7acf9413eea53faf5f158a1327e', 'https://ploi-plant-care.s3.amazonaws.com/shrine/ph…722442587bd19f1d36f2e32562921b868bdbdc18c6493f24c', 'https://ploi-plant-care.s3.amazonaws.com/shrine/ph…7163e858cfea40bb013cddd56d5a74c1ac683558482604136']
