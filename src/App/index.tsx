import './App.css';

import React, { useCallback, useMemo, useState } from 'react';

import {
  Checkbox,
  createMuiTheme,
  CssBaseline,
  FormControlLabel,
  ThemeProvider,
} from '@material-ui/core';
import { blue } from '@material-ui/core/colors';

import DataDisplay from '../DataDisplay';
import MappingBar from '../MappingBar';
import PasswordForm from '../PasswordForm';
import DarkModeToggle from './DarkModeToggle';
import useGetConfig from './useGetConfig';
import useGetPortals from './useGetPortals';
import useGetZones from './useGetZones';

const prefersDark = localStorage.getItem('darkMode')
  ? localStorage.getItem('darkMode') !== 'false'
  : window.matchMedia('(prefers-color-scheme: dark)').matches;

function App() {
  const [token, setToken] = useState<string>('');
  const [updateLayoutOnChange, setUpdateLayoutOnChange] = useState(true);
  const [isDark, setIsDark] = useState<boolean>(prefersDark);

  const config = useGetConfig();
  const zones = useGetZones(token, config?.publicRead);
  const [portals, updatePortals] = useGetPortals(token, config?.publicRead);

  const [sourceZone, setSourceZone] = useState<string | null>(null);

  const theme = useMemo(
    () =>
      createMuiTheme({
        palette: {
          background: {
            default: isDark ? '#333' : '#f0f0f0',
          },
          primary: isDark
            ? {
                main: '#81d4fa',
              }
            : blue,
          type: isDark ? 'dark' : 'light',
        },
        overrides: {
          MuiCssBaseline: {
            '@global': {
              html: {
                background: isDark ? '#333' : '#fff',
              },
              body: {
                background: isDark ? '#333' : '#fff',
                padding: `1rem`,
              },
            },
          },
        },
      }),
    [isDark]
  );

  const updateTheme = useCallback((isDark: boolean) => {
    localStorage.setItem('darkMode', `${isDark}`);
    setIsDark(isDark);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="app-container">
        <header className="main-header">
          <h1>Albion Mapper</h1>
          <DarkModeToggle isDark={isDark} update={updateTheme} />
        </header>

        <main className="layout">
          <aside className="search-side">
            {!token ? (
              <PasswordForm password={token} setPassword={setToken} />
            ) : (
              <>
                <MappingBar
                  fromId={sourceZone}
                  zones={zones}
                  token={token}
                  updatePortals={updatePortals}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={updateLayoutOnChange}
                      onChange={() =>
                        setUpdateLayoutOnChange(!updateLayoutOnChange)
                      }
                      name="layout-change"
                      color="primary"
                    />
                  }
                  label="Update layout after create"
                />
              </>
            )}
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <a
                style={{
                  color: isDark ? '#D9A807' : '#9D6901',
                  textDecoration: 'none',
                  fontWeight: 700,
                }}
                href="https://www.twitch.tv/hypnocode"
              >
                Follow me & watch me code this on Twitch
              </a>
            </div>
          </aside>
          {(!!token || config?.publicRead) && (
            <div className="map-display">
              <DataDisplay
                zones={zones}
                portals={portals}
                updateLayoutOnChange={updateLayoutOnChange}
                isDark={isDark}
                onNodeClick={(n) => setSourceZone(n)}
              />
            </div>
          )}
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
