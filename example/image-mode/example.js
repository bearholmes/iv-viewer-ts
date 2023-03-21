import ImageViewer from '../../dist/iv-viewer-ts.mjs';

Array.from(document.querySelectorAll('.pannable-image')).forEach((elem) => {
  new ImageViewer(elem);
});
