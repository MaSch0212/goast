FROM node:22-alpine

WORKDIR /opt/goast

# Dependencies land in their own layer, so editing tsconfig or the ambient declarations does not
# reinstall them.
COPY package.json ./
RUN npm install --no-audit --no-fund && ln -s /opt/goast/node_modules /node_modules

COPY tsconfig.base.json k6-jslib.d.ts check.mjs ./

# The committed tree is bind-mounted read-only at /tree, which shares no ancestor directory with
# /opt/goast. Node's module resolution algorithm (which `tsc` follows for a bare specifier like
# `@angular/core`) walks a file's own directory upward through every `node_modules` it finds,
# including one at the filesystem root — so the `/node_modules` symlink above is what makes
# `/opt/goast/node_modules` reachable from a file under `/tree` at all; NODE_PATH is not consulted by
# `tsc`'s resolver and does nothing here. Writing nothing into /tree is what keeps the gate from
# mutating reviewed output.
#
# The entrypoint is our own `check.mjs`, not the `tsc` binary — see that file's doc comment for why:
# the CLI silently drops every semantic diagnostic for the whole program when any file anywhere in it
# has a syntax error, which this corpus triggers in every profile.
ENTRYPOINT ["node", "/opt/goast/check.mjs"]
