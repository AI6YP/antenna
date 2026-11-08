// AMSAT, 2026-10-31 (static). heard = AMSAT status "Heard" reports, 30 days to 2026-11-08
export const sats = [
  {name: 'RS-44', mode: 'V/u linear', up: '145.935–145.995', down: '435.610–435.670', heard: 815},
  {name: 'ISS', mode: 'V/u FM', up: '145.990', down: '437.800', heard: 660},
  {name: 'SO-50', mode: 'V/u FM', up: '145.850', down: '436.795', heard: 499},
  {name: 'FO-29', mode: 'V/u linear', up: '145.900–146.000', down: '435.800–435.900', heard: 498},
  {name: 'JO-97', mode: 'U/v linear', up: '435.100–435.120', down: '145.855–145.875', heard: 266},
  {name: 'AO-7 B', mode: 'U/v linear', up: '432.125–432.175', down: '145.925–145.975', heard: 239},
  {name: 'AO-123', mode: 'V/u FM', up: '145.850', down: '435.400', heard: 160},
  {name: 'RS95S', mode: 'V/u FM', up: '145.920', down: '436.950', heard: 64},
  {name: 'IO-86', mode: 'V/u FM', up: '145.880', down: '435.880', heard: 38}
];

export const render = el => {
  el.innerHTML = '<table><thead><tr><th>sat</th><th>mode</th><th>uplink MHz</th><th>downlink MHz</th><th>heard / 30 d</th></tr></thead><tbody>' +
    sats.map(s => '<tr><td>' + s.name + '</td><td>' + s.mode + '</td><td>' + s.up + '</td><td>' + s.down + '</td><td>' + s.heard + '</td></tr>').join('') +
    '</tbody></table><p class="note">Sources: amsat.org live FM / linear satellites, AMSAT status API.</p>';
};
