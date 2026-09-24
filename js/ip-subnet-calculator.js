'use strict';

(function () {
  const el = (id) => document.getElementById(id);
  const form = el('subnet-form');
  if (!form) return;

  function ipToInt(ip) {
    const parts = ip.trim().split('.');
    if (parts.length !== 4) return null;
    if (!parts.every((p) => /^\d{1,3}$/.test(p))) return null;
    const octets = parts.map((p) => parseInt(p, 10));
    if (octets.some((o) => o < 0 || o > 255)) return null;
    return ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
  }

  function intToIp(int) {
    return [(int >>> 24) & 255, (int >>> 16) & 255, (int >>> 8) & 255, int & 255].join('.');
  }

  function ipClass(firstOctet) {
    if (firstOctet <= 126) return 'A';
    if (firstOctet === 127) return 'A (Loopback)';
    if (firstOctet <= 191) return 'B';
    if (firstOctet <= 223) return 'C';
    if (firstOctet <= 239) return 'D (Multicast)';
    return 'E (Reserved)';
  }

  function isPrivate(int) {
    const a = (int >>> 24) & 255, b = (int >>> 16) & 255;
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    return false;
  }

  function calculate() {
    const ipStr = el('subnet-ip').value.trim();
    const prefix = parseInt(el('subnet-prefix').value, 10);
    const resultEl = el('subnet-result');

    const ipInt = ipToInt(ipStr);
    if (ipInt === null) {
      resultEl.innerHTML = '<p class="tool-result is-error">Enter a valid IPv4 address, e.g. 192.168.1.10.</p>';
      return;
    }

    const maskInt = prefix === 0 ? 0 : (0xFFFFFFFF << (32 - prefix)) >>> 0;
    const wildcardInt = (~maskInt) >>> 0;
    const networkInt = (ipInt & maskInt) >>> 0;
    const broadcastInt = (networkInt | wildcardInt) >>> 0;
    const totalHosts = Math.pow(2, 32 - prefix);

    let usableHosts, rangeText;
    if (prefix === 32) {
      usableHosts = 1;
      rangeText = intToIp(networkInt);
    } else if (prefix === 31) {
      usableHosts = 2;
      rangeText = `${intToIp(networkInt)} - ${intToIp(broadcastInt)}`;
    } else {
      usableHosts = totalHosts - 2;
      rangeText = `${intToIp(networkInt + 1)} - ${intToIp(broadcastInt - 1)}`;
    }

    resultEl.innerHTML = `
      <div class="summary-payment-box">
        <div class="label">Network Address</div>
        <div class="value">${intToIp(networkInt)}</div>
      </div>
      <div class="stat-row"><span>Broadcast Address</span><strong>${intToIp(broadcastInt)}</strong></div>
      <div class="stat-row"><span>Usable Host Range</span><strong>${rangeText}</strong></div>
      <div class="stat-row"><span>Subnet Mask</span><strong>${intToIp(maskInt)}</strong></div>
      <div class="stat-row"><span>Wildcard Mask</span><strong>${intToIp(wildcardInt)}</strong></div>
      <div class="stat-row"><span>Total Hosts</span><strong>${totalHosts.toLocaleString('en-US')}</strong></div>
      <div class="stat-row"><span>Usable Hosts</span><strong>${usableHosts.toLocaleString('en-US')}</strong></div>
      <div class="stat-row"><span>IP Class</span><strong>${ipClass((ipInt >>> 24) & 255)}</strong></div>
      <div class="stat-row"><span>IP Type</span><strong>${isPrivate(ipInt) ? 'Private' : 'Public'}</strong></div>
      <div class="stat-row"><span>CIDR Notation</span><strong>${ipStr}/${prefix}</strong></div>
    `;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); calculate(); });
  form.querySelectorAll('input, select').forEach((i) => i.addEventListener('input', calculate));
  calculate();
})();
