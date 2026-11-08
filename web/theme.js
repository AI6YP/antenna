// Day / Night / Auto theme: html[data-theme] = light | dark | (absent = auto)
export const themes = ['light', 'dark', 'auto'];

export const getTheme = () => localStorage.getItem('theme') || 'auto';

export const setTheme = th => {
  if (th === 'auto') {
    document.documentElement.removeAttribute('data-theme');
    localStorage.removeItem('theme');
  } else {
    document.documentElement.setAttribute('data-theme', th);
    localStorage.setItem('theme', th);
  }
};
