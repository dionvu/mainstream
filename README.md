# mainstream

A CLI to keep up with all the latest and greatest anime and keep track of your favorites using [Consumet API](https://github.com/consumet/api.consumet.org/blob/main/README.md).

## installation

### npm

```
npm install -g mainstreamcli
npm install -g node-localstorage
```

Node-localstorage required for mainstream to access recent shows stored in `~/.mainstream`.

## dependencies

### mpv

[mpv installation](https://mpv.io/installation/)

Required to play anime episodes.

## usage

### search

```
ms s
```

### recent 

```
ms r
```
Browse recently watched shows.

### current

```
ms c
```
Browse shows that are currently airing.

## uninstall

```
npm remove -g mainstreamcli
npm remove -g node-localstorage
cd ~ & rm -rf .mainstream
```
