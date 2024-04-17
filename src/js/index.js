import Three from './three';

document.addEventListener('DOMContentLoaded', () => { });

window.addEventListener('load', () => {
  const canvas = document.querySelector('#canvas');

  if (canvas) {
    new Three(document.querySelector('#canvas'));
  }
});
