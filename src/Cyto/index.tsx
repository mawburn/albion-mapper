import './styles.css';

import cytoscape, { CytoscapeOptions } from 'cytoscape';
import COSEBilkent from 'cytoscape-cose-bilkent';
import React, { FC, useEffect, useRef, useState } from 'react';

import { Portal, Zone } from '../types';
import defaultSettings from './defaultSettings';
import graphStyle from './graphStyle';
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

  const cy = useRef<any>(null);
  const elements = useRef<Map<string, CytoMapElement>>(new Map());

  const [size, setSize] = useState<number>(-1);
  const [remove, setRemove] = useState<string[]>([]);

  useEffect(() => {
    if (!cy.current) {
      cy.current = cytoscape({
        ...defaultSettings,
        style: graphStyle(isDark),
        container: containerRef.current,
      } as CytoscapeOptions);
    }
  }, [isDark]);

  useEffect(() => {
    if (cy.current) {
      cy.current.style(graphStyle(isDark));
    }
  }, [isDark]);

  useEffect(() => {
    const elms = elements.current;
    const allKeys: string[] = [];

    if (portals.length) {
      const filteredZones = zones.filter(
        (z) =>
          !!portals?.find((p) => p.source === z.name || p.target === z.name)
      );

      filteredZones.forEach((z) => {
        allKeys.push(z.name);

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
        allKeys.push(id);

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

      const removeKeys: string[] = Array.from(elms.keys()).filter(
        (k) => !allKeys.includes(k)
      );

      console.log(removeKeys);

      if (removeKeys.length) {
        setRemove(removeKeys);
      }

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

  useEffect(() => {
    if (remove.length) {
      console.log(remove);

      remove.forEach((k) => {
        //   cy.current.remove(cy.current.id(k));
      });

      cy.current.layout(defaultSettings.layout).run();
      setRemove([]);
    }
  }, [remove]);

  useEffect(() => {
    setTimeout(() => {
      const sel = cy.current.$('#Astolat');
      cy.current.remove(sel);
      cy.current.layout(defaultSettings.layout).run();
      console.log('should be gone');
    }, 2000);
  }, []);

  return (
    <div className="cyto">
      <div ref={containerRef} />
    </div>
  );
};

export default Cyto;
