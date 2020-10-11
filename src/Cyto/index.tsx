import React, { FC, useEffect, useRef, useState } from 'react';
import cytoscape, { CytoscapeOptions } from 'cytoscape';
import COSEBilkent from 'cytoscape-cose-bilkent';
import graphStyle from './graphStyle';
import defaultSettings from './defaultSettings';
import './styles.css';
import { Portal, Zone } from '../types';
import { portalSizeToColor, zoneColorToColor } from './mapStyle';

cytoscape.use(COSEBilkent);

interface CytoProps {
  isDark: boolean;
  zones: Zone[];
  portals: Portal[];
}

interface CytoMapElement {
  added: boolean;
  element: object;
}

const Cyto: FC<CytoProps> = ({ isDark, portals, zones }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const styleRef = useRef(graphStyle(isDark));
  const cy = useRef<any>(null);
  const elements = useRef<Map<string, CytoMapElement>>(new Map());

  const [size, setSize] = useState<number>(-1);

  useEffect(() => {
    if (!cy.current) {
      cy.current = cytoscape({
        ...defaultSettings,
        style: styleRef.current,
        container: containerRef.current,
      } as CytoscapeOptions);
    }
  }, []);

  useEffect(() => {
    const elms = elements.current;

    if (portals.length) {
      const filteredZones = zones.filter(
        (z) =>
          !!portals?.find((p) => p.source === z.name || p.target === z.name)
      );

      filteredZones.forEach((z) => {
        if (!elms.has(z.name)) {
          elms.set(z.name, {
            added: false,
            element: {
              data: { id: z.name, label: z.name },
              style: {
                backgroundColor: zoneColorToColor[z.color],
                shape: z.type.indexOf('TUNNEL_HIDEOUT') >= 0 ? 'pentagon' : '',
              },
            },
          });
        }
      });

      portals.forEach((p) => {
        const id = `${p.source}${p.target}`.replace(' ', '');

        if (!elms.has(id)) {
          elms.set(id, {
            added: false,
            element: {
              data: {
                id,
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
            },
          });
        }
      });

      setSize(elms.size);
    }
  }, [zones, portals]);

  useEffect(() => {
    const elms = elements.current;

    let updated = false;

    elms.forEach((val, key) => {
      if (!val.added) {
        cy.current.add(val.element);
        elms.set(key, { added: true, element: { ...val.element } });
        updated = true;
      }
    });

    if (updated) {
      cy.current.layout(defaultSettings.layout).run();
    }
  }, [size]);

  return (
    <div className="cyto">
      <div ref={containerRef} />
    </div>
  );
};

export default Cyto;
