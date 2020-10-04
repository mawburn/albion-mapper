import { ElementDefinition } from 'cytoscape';
import React, { useCallback, useRef, useState } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';

import { Portal, Zone } from './types';

interface DataDisplayProps {
  zones: Zone[];
  portals: Portal[] | null;
  updateLayoutOnChange: boolean;
  onNodeClick: (id: string) => void;
}

const portalSizeToColor = {
  2: 'green',
  7: 'blue',
  20: 'orange',
};

const zoneColorToColor = {
  black: 'black',
  red: 'red',
  yellow: 'yellow',
  blue: 'blue',
  road: 'lightblue',
};

const DataDisplay: React.FC<DataDisplayProps> = ({
  zones,
  portals,
  updateLayoutOnChange,
  onNodeClick,
}) => {
  const darkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;

  const mapContainer = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState('breadthfirst');

  const filteredZones = zones.filter(
    (z) => !!portals?.find((p) => p.source === z.name || p.target === z.name)
  );

  const [activeZoneName, setActiveZoneName] = useState('');

  const activeZone = filteredZones.find((z) => z.name === activeZoneName);

  const cyEventHandler = useCallback(
    (e: cytoscape.EventObject) => {
      onNodeClick(e.target.id());
      setActiveZoneName(e.target.id());

      e.cy.nodes().forEach((n) => {
        if (n.id() !== e.target.id()) {
          n.style('borderWidth', '0');
        } else {
          n.style('borderColor', '#ea80fc');
          n.style('borderWidth', '2');
        }
      });
    },
    [onNodeClick, setActiveZoneName]
  );

  const cyNodeEventUpdate = useCallback(
    (e: cytoscape.EventObject) => {
      if (updateLayoutOnChange) {
        e.cy.layout({ name: layout }).run();
      }
    },
    [layout, updateLayoutOnChange]
  );

  const portalMap = portals || [];

  const data: ElementDefinition[] = [
    ...filteredZones.map((z) => ({
      data: { id: z.name, label: z.name },
      style: {
        backgroundColor: zoneColorToColor[z.color],
        shape: z.type.indexOf('TUNNEL_HIDEOUT') >= 0 ? 'pentagon' : '',
      },
    })),
    ...portalMap.map((p) => ({
      data: {
        source: p.source,
        target: p.target,
        label: `${Math.floor(p.timeLeft / 60)}h ${Math.round(
          p.timeLeft % 60
        )}min`,
      },
      classes: p.timeLeft < 30 ? 'timeLow' : '',
      style: {
        lineColor: portalSizeToColor[p.size],
      },
    })),
  ];

  return (
    <>
      <div className="h100" ref={mapContainer}>
        {zones.length && !!portals ? (
          <CytoscapeComponent
            elements={data}
            cy={(cy) => {
              cy.on('tap', 'node', cyEventHandler);
              cy.on('add', 'node', cyNodeEventUpdate);
            }}
            className="cyto"
            stylesheet={[
              {
                selector: 'node[label]',
                css: {
                  label: 'data(label)',
                  color: darkTheme ? 'white' : 'black',
                },
              },
              {
                selector: 'edge[label]',
                css: {
                  label: 'data(label)',
                  width: 3,
                  color: darkTheme ? 'white' : 'black',
                },
              },
              {
                selector: '.timeLow',
                css: {
                  color: 'red',
                },
              },
            ]}
            layout={{ name: layout }}
          />
        ) : (
          <div className="cyto">Loading</div>
        )}
      </div>
      <div className="cyto-below">
        <select onChange={(e) => setLayout(e.target.value)} value={layout}>
          <option value="random">random</option>
          <option value="grid">grid</option>
          <option value="circle">circle</option>
          <option value="cose">cose</option>
          <option value="concentric">concentric</option>
          <option value="breadthfirst">breadthfirst</option>
        </select>
        {activeZone && (
          <table>
            <tbody>
              <tr>
                <td>Name</td>
                <td>{activeZone.name}</td>
              </tr>
              <tr>
                <td>Type</td>
                <td>{activeZone.type}</td>
              </tr>
              <tr>
                <td>Resources</td>
                <td>
                  {activeZone.resources &&
                    activeZone.resources
                      .map((r) => `T${r.tier} ${r.name}`)
                      .join(', ')}
                </td>
              </tr>
              <tr>
                <td>Map markers</td>
                <td>{activeZone.markers && activeZone.markers.join(', ')}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

export default DataDisplay;
