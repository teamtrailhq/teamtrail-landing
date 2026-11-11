---
title: Sign in to the Lookout · Teamtrail docs
description: The Lookout opens only in browsers you've paired. teamtrail opens your browser ready to sign in with one click, prints a one-time link for another browser, and phones pair with a short code or QR code.
---

# Sign in to the Lookout

The Lookout opens only in browsers you've paired. The first time, `teamtrail` opens your browser ready to sign in: one click.

## The first browser

```bash
cd your-repo
teamtrail
```

The Lookout is at `http://127.0.0.1:7420/` (or the next free port). `teamtrail` opens your default web browser on its sign-in page with the code filled in. Click **Sign in this browser**. That page's code works once, within a minute.

It also prints a one-time **Sign in** link in its terminal, for another browser:

```text
  Lookout  http://127.0.0.1:7420/
  Sign in  http://127.0.0.1:7420/#pair=…
```

Open it there and click **Sign in this browser**. The link works once, within 10 minutes, and only for the Lookout that printed it.

A code is never passed to the browser on a command line, where other programs could read it. Teamtrail finds your default web browser by name (never whatever opens `.html` files) and opens it on a one-time page in its config folder, readable only by your user, that sends it on to the sign-in page. The page is deleted once used, when its code expires, or when `teamtrail` stops.

Every sign-in through the opened page is announced in the terminal, with the time and a short id:

```text
  Signed in a browser (opened page) at 10:42:07: Chrome on macOS · si_3f9c2a. Not you? Revoke it in Settings → Browsers & devices.
```

**Settings → You → Browsers & devices** marks that browser with the same id. If it wasn't you, **Revoke** it there. Why this matters: [What sign-in protects](#what-sign-in-protects).

If the default browser can't be found, or it's a Snap or Flatpak browser on Linux (they can't read the page), the Lookout opens without the code and the terminal says why. Use the printed link.

A browser that isn't paired sees **Pair this browser**, with how to get a link.

The address is always `127.0.0.1`, never `localhost`: a browser may send `localhost` to `::1` instead.

## Another browser on this machine

While the Lookout runs, run this in the repo:

```bash
teamtrail pair
```

After checking that the server at the Lookout's address really is that Lookout, it opens a browser tab ready to sign in, the same way `teamtrail` does, and prints a new one-time link (10 minutes) for any other browser. Click **Sign in this browser** in whichever you use.

`teamtrail pair --no-open` only prints the link.

## A phone or another computer

Other devices can reach the Lookout only when you start it with `--host` (see [Other devices](#other-devices)). Then, on the machine:

1. Open **Settings → You → Browsers & devices** and press **Pair a device**.
2. On the device, open the Lookout at the machine's address, such as `http://192.168.1.20:7420/`.
3. Type the short code (`ABCD-EFGH`) there, or scan its QR code with the device's camera.

A device code works once, within 5 minutes. Wrong codes are held back after a few tries.

## How long you stay signed in

- A browser stays signed in while that Lookout runs, up to 30 days after it was last used.
- **When you restart `teamtrail`, every browser and device pairs again.** The terminal prints a new link each time it starts. A session from an earlier start opens nothing, so a session a program grabbed while the Lookout was stopped is useless.
- **Settings → You → Browsers & devices** lists every paired browser. **Revoke** signs one out at once, and **Sign out of this browser** signs out the one you're using.

Pairing, device codes and revokes are written to the project's journal (`.events/_sign-in.jsonl`), never a session or a code.

## Other devices

`--host` takes an IP address, never a host name:

```bash
teamtrail --host 192.168.1.20   # one address
teamtrail --host 0.0.0.0        # each of the machine's network addresses
```

- `0.0.0.0` (or `::`) means each of the machine's network addresses at the moment it starts. The Lookout holds each address itself, and only those are offered for pairing.
- **After a network change** (a new Wi-Fi, a VPN), restart `teamtrail` to serve the new address.
- It always listens on `127.0.0.1` and `::1` too. If another program already holds the port on any of those addresses, it doesn't start and names the address.

The connection is plain HTTP. Only use `--host` on a network you trust, and never put the Lookout's port behind a proxy or tunnel. What a paired device may do is in [Approvals and security](/docs/security/#devices-on-your-network).

## What sign-in protects

Sign-in stops a program on your machine, or a device on your network, that isn't a paired browser. An agent with `curl` can't approve its own work, answer its own questions or change your settings through the Lookout.

- The session is never a cookie. Browsers send cookies to every port of a host, so another server on your machine (an agent's dev server, say) would get it. The session stays in the Lookout page's own storage, and only that page sends it.
- Before the page sends its session, the server proves it is your Lookout. If it can't, the page says **Teamtrail isn't running here** and sends nothing. It reconnects once the Lookout is back.
- The code in a sign-in link travels after `#`, which no server sees.

It can't stop a program that can write Teamtrail's config folder (it can make a pairing code, as `teamtrail pair` does), one that can read it while a sign-in page Teamtrail opened waits (up to a minute; such a sign-in is announced), or one that can read your browser's profile on disk. [`teamtrail connect`](/docs/connect-your-agent/#keep-agents-out-of-the-config-folder) keeps the agents it registers out of the config folder.

The MCP endpoints keep their own tokens and are not affected: see [Remote agents](/docs/remote-agents/).

## Troubleshooting

| You see                                                                        | What to do                                                                                                                                               |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pair this browser**                                                          | Open the Sign in link from the terminal, or run `teamtrail pair` for a new one.                                                                          |
| **Teamtrail isn't running here**                                               | Start `teamtrail` in the repo. The page reconnects by itself once the Lookout answers.                                                                   |
| The link no longer works                                                       | It was used, it's older than 10 minutes, or the Lookout restarted. Run `teamtrail pair`.                                                                 |
| **This link was already used or has expired** in the tab Teamtrail opened      | If you didn't sign in just now, someone else may have. Check **Browsers & devices** in a signed-in browser, or restart `teamtrail` to end every session. |
| The browser opened signed out                                                  | No default browser was found, or it's a Snap or Flatpak. Use the link printed in the terminal.                                                           |
| `teamtrail pair`: `No Lookout is running for this folder`                      | Start `teamtrail` first: it prints a link of its own.                                                                                                    |
| `teamtrail pair`: `This folder is open in a Lookout started in another folder` | Run `teamtrail pair` in the folder where that Lookout was started.                                                                                       |
| A phone stopped working                                                        | The Lookout restarted, or your network changed. Restart `teamtrail` if the address changed, then pair again.                                             |
| **Pair a device** says the Lookout listens on this machine only                | Start it with `--host`, on a network you trust.                                                                                                          |
