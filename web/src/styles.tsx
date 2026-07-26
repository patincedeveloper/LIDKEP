import { Global, ThemeProvider, css } from '@emotion/react';

export const palette = {
  ink: '#102a27', muted: '#59706c', green: '#0b6255', greenDark: '#073f38', lime: '#b8dd72',
  amber: '#d99622', paper: '#f6f8f5', white: '#ffffff', line: '#dce6df', soft: '#eaf4ec',
  danger: '#b42318', dangerSoft: '#fef3f2', info: '#175cd3', infoSoft: '#eff8ff', purple: '#6941c6',
  purpleSoft: '#f4f3ff', success: '#067647', successSoft: '#ecfdf3', warning: '#b54708', warningSoft: '#fffaeb'
};

export const theme = {
  colors: palette,
  spacing: (step: number) => `${step * 4}px`,
  radii: { sm: '8px', md: '12px', lg: '18px', pill: '999px' },
  shadows: { sm: '0 1px 2px rgba(16,42,39,.05)', md: '0 12px 30px rgba(16,42,39,.09)' },
  breakpoints: { mobile: '560px', tablet: '860px', desktop: '1100px' }
};

export const AppTheme = ({ children }: { children: React.ReactNode }) => <ThemeProvider theme={theme}>{children}</ThemeProvider>;
export const GlobalStyle = () => <Global styles={css`
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap');
  * { box-sizing:border-box; }
  html { scroll-behavior:smooth; background:${palette.paper}; }
  body { margin:0; min-width:360px; background:${palette.paper}; color:${palette.ink}; font-family:'DM Sans',system-ui,sans-serif; font-size:16px; line-height:1.5; }
  button,input,select,textarea { font:inherit; }
  button,a,select { cursor:pointer; }
  button:disabled { cursor:not-allowed; opacity:.48; }
  a { color:inherit; text-decoration:none; }
  img,svg { display:block; }
  h1,h2,h3,p { overflow-wrap:anywhere; }
  :focus-visible { outline:3px solid ${palette.amber}; outline-offset:3px; }
  ::selection { background:${palette.lime}; color:${palette.greenDark}; }
  @media(prefers-reduced-motion:reduce){*,*:before,*:after{scroll-behavior:auto!important;transition-duration:.01ms!important;animation-duration:.01ms!important;}}
`}/>;
