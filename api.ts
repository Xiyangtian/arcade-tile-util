namespace MapConnectionKind {
    let nextKind: number
    export function create() {
        if (nextKind === undefined) nextKind = 1;
        return nextKind++;
    }

    //% isKind
    export const Door1 = create();

    //% isKind
    export const Door2 = create();

    //% isKind
    export const Door3 = create();

    //% isKind
    export const Door4 = create();
}

//% color=#879bff icon="\uf279"
//% block="瓦片工具"
//% groups='["地图", "瓦片", "事件", "连接", "相机"]'
namespace tileUtil {
    export enum TilemapProperty {
        //% block="列数"
        Columns,
        //% block="行数"
        Rows,
        //% block="宽度"
        PixelWidth,
        //% block="高度"
        PixelHeight,
        //% block="瓦片宽度"
        TileWidth
    }

    /**
     * Reads a property from a tilemap
     */
    //% blockId=tileUtil_tilemapProperty
    //% block="$data 的 $prop"
    //% data.shadow=variables_get
    //% data.defl=tilemap
    //% group=地图
    //% help=github:arcade-tile-util/docs/tilemap-property
    export function tilemapProperty(data: tiles.TileMapData, prop: TilemapProperty): number {
        switch (prop) {
            case TilemapProperty.Columns:
                return data.width;
            case TilemapProperty.Rows:
                return data.height;
            case TilemapProperty.PixelWidth:
                return data.width << data.scale;
            case TilemapProperty.PixelHeight:
                return data.height << data.scale;
            case TilemapProperty.TileWidth:
                return 1 << data.scale;
        }
    }

    /**
     * Gets the "kind" of tilemap connection
     */
    //% shim=KIND_GET
    //% blockId=tileUtil_connectionKind block="$kind"
    //% group="连接" weight=0
    //% kindNamespace=MapConnectionKind kindMemberName=kind kindPromptHint="例如 Door1, Tunnel1, ..."
    //% help=github:arcade-tile-util/docs/connection-kind
    export function _connectionKind(kind: number): number {
        return kind;
    }

    /**
     * Connects two tilemaps with a connection name or number.
     * Connections work in both ways and are remembered by both tilemaps.
     */
    //% block="通过 $connectionId 连接 $mapA 和 $mapB"
    //% blockId=tileUtil_connectMapById
    //% mapA.shadow=variables_get
    //% mapA.defl=tilemap1
    //% mapB.shadow=variables_get
    //% mapB.defl=tilemap2
    //% connectionId.shadow=tileUtil_connectionKind
    //% group="连接" weight=40 blockGap=8
    //% help=github:arcade-tile-util/docs/connect-maps
    export function connectMaps(mapA: tiles.TileMapData, mapB: tiles.TileMapData, connectionId: number): void {
        _state().connectMaps(mapA, mapB, connectionId);
    }

    /**
     * Gets the destination tilemap connected to the source tilemap by the given connection name or number.
     */
    //% block="获取通过 $connectionId 与 $map 相连的地图"
    //% blockId=tileUtil_getConnectedMap
    //% map.shadow=variables_get
    //% map.defl=tilemap
    //% connectionId.shadow=tileUtil_connectionKind
    //% group="连接" weight=10 blockGap=8
    //% help=github:arcade-tile-util/docs/get-connected-map
    export function getConnectedMap(map: tiles.TileMapData, connectionId: number): tiles.TileMapData {
        return _state().getConnectedMap(map, connectionId);
    }

    /**
     * Loads the overworld tilemap connected to the current tilemap by the
     * given connection name or number.
     */
    //% block="加载通过 $connectionId 相连的地图"
    //% blockId=tileUtil_loadConnectedMap
    //% connectionId.shadow=tileUtil_connectionKind
    //% group="连接" weight=30 blockGap=8
    //% help=github:arcade-tile-util/docs/load-connected-map
    export function loadConnectedMap(connectionId: number) {
        const nextMap = getConnectedMap(currentTilemap(), connectionId)
        if (nextMap) {
            scene.setTileMapLevel(nextMap);
        }
    }

    /**
     * Creates a tilemap with 8x8 tiles that can be connected to other tilemaps through the overworld.
     */
    //% blockId=tileUtil_createSmallMap
    //% block="8x8 小瓦片地图 $tilemap"
    //% tilemap.fieldEditor="tilemap"
    //% tilemap.fieldOptions.decompileArgumentAsString="true"
    //% tilemap.fieldOptions.filter="tile"
    //% tilemap.fieldOptions.taggedTemplate="tilemap"
    //% tilemap.fieldOptions.tileWidth=8
    //% tilemap.fieldOptions.initWidth=20
    //% tilemap.fieldOptions.initHeight=15
    //% group="地图" weight=49 blockGap=8
    //% duplicateShadowOnDrag
    //% help=github:arcade-tile-util/docs/create-small-map
    export function createSmallMap(tilemap: tiles.TileMapData): tiles.TileMapData {
        return tilemap
    }

    /**
     * Clone an existing tilemap (does not copy connections to other maps). Be careful
     * when using this on hardware because it can use a lot of memory.
     */
    //% block="克隆地图 $map"
    //% blockId=tileUtil_cloneMap
    //% map.shadow=variables_get
    //% map.defl=tilemap
    //% group="地图" weight=25 blockGap=8
    //% help=github:arcade-tile-util/docs/clone-map
    export function cloneMap(map: tiles.TileMapData): tiles.TileMapData {
        const buffer = control.createBuffer(4 + map.width * map.height);
        buffer.setNumber(NumberFormat.UInt16LE, 0, map.width);
        buffer.setNumber(NumberFormat.UInt16LE, 2, map.height);

        const result = tiles.createTilemap(
            buffer,
            image.create(map.width, map.height),
            map.getTileset().slice(),
            map.scale
        );

        for (let x = 0; x < map.width; x++) {
            for (let y = 0; y < map.height; y++) {
                result.setTile(x, y, map.getTile(x, y))
                result.setWall(x, y, map.isWall(x, y));
            }
        }

        return result;
    }

    /**
     * Runs code when a tilemap is loaded.
     */
    //% block="当地图 $tilemap 加载时"
    //% blockId=tileUtil_onMapLoaded
    //% draggableParameters="reporter"
    //% group="事件" weight=20 blockGap=8
    //% help=github:arcade-tile-util/docs/on-map-loaded
    export function onMapLoaded(cb: (tilemap: tiles.TileMapData) => void) {
        tiles.addEventListener(tiles.TileMapEvent.Loaded, cb);
    }

    /**
     * Runs code when a tilemap is unloaded.
     */
    //% block="当地图 $tilemap 卸载时"
    //% blockId=tileUtil_onMapUnloaded
    //% draggableParameters="reporter"
    //% group="事件" weight=10 blockGap=8
    //% help=github:arcade-tile-util/docs/on-map-unloaded
    export function onMapUnloaded(cb: (tilemap: tiles.TileMapData) => void) {
        tiles.addEventListener(tiles.TileMapEvent.Unloaded, cb);
    }

    /**
     * Unloads the current tilemap so that there is no tilemap
     * currently active
     */
    //% block="卸载当前地图"
    //% blockId=tileUtil_unloadTilemap
    //% group="事件" weight=0 blockGap=8
    //% help=github:arcade-tile-util/docs/unload-tilemap
    export function unloadTilemap() {
        if (game.currentScene().tileMap) {
            game.currentScene().tileMap.setData(undefined);
        }
    }

    /**
     * Cover all tiles of a given kind with a different tile image.
     * These cover images are removed when the tilemap changes.
     */
    //% block="用 $cover 覆盖所有 $tileKind 瓦片"
    //% blockId=tileUtil_coverAllTiles
    //% tileKind.shadow=tileset_tile_picker
    //% tileKind.decompileIndirectFixedInstances=true
    //% cover.shadow=tileset_tile_picker
    //% cover.decompileIndirectFixedInstances=true
    //% group="瓦片" weight=40 blockGap=8
    //% help=github:arcade-tile-util/docs/cover-all-tiles
    export function coverAllTiles(tileKind: Image, cover: Image) {
        if (!game.currentScene().tileMap || !game.currentScene().tileMap.enabled) return;

        const state = _state();
        for (const location of tiles.getTilesByType(tileKind)) {
            state.coverTile(location.column, location.row, cover)
        }
    }

    /**
     * Cover a tile at a location with a different tile image.
     * The cover image will be removed when the tilemap changes.
     */
    //% block="在 $location 覆盖 $cover"
    //% blockId=tileUtil_coverTile
    //% location.shadow=mapgettile
    //% cover.shadow=tileset_tile_picker
    //% cover.decompileIndirectFixedInstances=true
    //% group="瓦片" weight=35 blockGap=8
    //% help=github:arcade-tile-util/docs/cover-tile
    export function coverTile(location: tiles.Location, cover: Image) {
        if (!game.currentScene().tileMap || !game.currentScene().tileMap.enabled) return;

        _state().coverTile(location.column, location.row, cover);
    }

    /**
     * Replace all tiles of a given kind in the loaded tilemap with
     * another tile.
     */
    //% block="将所有 $from 瓦片替换为 $to"
    //% blockId=tileUtil_replaceAllTiles
    //% from.shadow=tileset_tile_picker
    //% from.decompileIndirectFixedInstances=true
    //% to.shadow=tileset_tile_picker
    //% to.decompileIndirectFixedInstances=true
    //% group="瓦片" weight=20 blockGap=8
    //% help=github:arcade-tile-util/docs/replace-all-tiles
    export function replaceAllTiles(from: Image, to: Image) {
        for (const loc of tiles.getTilesByType(from)) {
            tiles.setTileAt(loc, to)
        }
    }

    /**
     * Turns walls on or off for all tiles of a given kind.
     */
    //% block="设置所有 $tile 位置的墙壁为 $on"
    //% blockId=tileUtil_setWalls
    //% tile.shadow=tileset_tile_picker
    //% tile.decompileIndirectFixedInstances=true
    //% on.shadow=toggleOnOff
    //% group="瓦片" weight=10
    //% help=github:arcade-tile-util/docs/set-walls
    export function setWalls(tile: Image, on: boolean) {
        for (const loc of tiles.getTilesByType(tile)) {
            tiles.setWallAt(loc, on);
        }
    }

    /**
     * Sets the tile at a given location in a tilemap
     */
    //% blockId=tileUtil_setTileAt
    //% block="在 $tilemap 的 $location 设置 $tile"
    //% tilemap.shadow=variables_get
    //% tilemap.defl=myTilemap
    //% location.shadow=mapgettile
    //% tile.shadow=tileset_tile_picker
    //% group=瓦片
    //% weight=8
    //% blockGap=8
    //% help=github:arcade-tile-util/docs/set-tile-at
    export function setTileAt(tilemap: tiles.TileMapData, location: tiles.Location, tile: Image) {
        let index: number;

        const tileset = tilemap.getTileset();
        for (let i = 0; i < tileset.length; i++) {
            if (tileset[i].equals(tile)) {
                index = i;
                break;
            }
        }

        if (index === undefined) {
            // not found; append to the tileset if there are spots left.
            const newIndex = tileset.length;
            if (newIndex < 0xff) {
                tileset.push(tile);
                index = newIndex;
            }
        }

        if (index === undefined) {
            throw "Too many tiles in tilemap";
        }


        tilemap.setTile(
            location.column,
            location.row,
            index
        );
    }

    /**
     * Sets whether a wall is on or off at a given location in a tilemap.
     */
    //% blockId=tileUtil_setWallAt
    //% block="在 $tilemap 的 $location 设置墙壁 $on"
    //% tilemap.shadow=variables_get
    //% tilemap.defl=myTilemap
    //% location.shadow=mapgettile
    //% tile.shadow=tileset_tile_picker
    //% group=瓦片
    //% weight=7
    //% help=github:arcade-tile-util/docs/set-wall-at
    export function setWallAt(tilemap: tiles.TileMapData, location: tiles.Location, on: boolean) {
        tilemap.setWall(location.column, location.row, on);
    }

    /**
     * Tests to see if the tile at a given location in a tilemap matches a given tile image.
     */
    //% blockId=tileUtil_tileIs
    //% block="$tilemap 中 $location 的瓦片是 $tile"
    //% tilemap.shadow=variables_get
    //% tilemap.defl=myTilemap
    //% location.shadow=mapgettile
    //% tile.shadow=tileset_tile_picker
    //% group=瓦片
    //% weight=5
    //% blockGap=8
    //% help=github:arcade-tile-util/docs/tile-is
    export function tileIs(tilemap: tiles.TileMapData, location: tiles.Location, tile: Image): boolean {
        return tilemap.getTileImage(
            tilemap.getTile(location.column, location.row)
        ).equals(tile);
    }

    /**
     * Tests to see if there is a wall at a given location in a tilemap.
     */
    //% blockId=tileUtil_tileIsWall
    //% block="$tilemap 中 $location 是墙壁"
    //% tilemap.shadow=variables_get
    //% tilemap.defl=myTilemap
    //% location.shadow=mapgettile
    //% group=瓦片
    //% weight=4
    //% blockGap=8
    //% help=github:arcade-tile-util/docs/tile-is-wall
    export function tileIsWall(tilemap: tiles.TileMapData, location: tiles.Location): boolean {
        return tilemap.isWall(location.column, location.row);
    }


    /**
     * Gets the tile image in a tilemap at the given location
     */
    //% blockId=tileUtil_getTileImage
    //% block="$tilemap 中 $location 的瓦片图片"
    //% tilemap.shadow=variables_get
    //% tilemap.defl=myTilemap
    //% location.shadow=mapgettile
    //% group=瓦片
    //% weight=3
    //% help=github:arcade-tile-util/docs/get-tile-image
    export function getTileImage(tilemap: tiles.TileMapData, location: tiles.Location): Image {
        return tilemap.getTileImage(tilemap.getTile(location.column, location.row));
    }

    /**
     * Returns the loaded tilemap.
     */
    //% block="当前地图"
    //% blockId=tileUtil_getLoadedMap
    //% group="地图" weight=30
    //% help=github:arcade-tile-util/docs/current-tilemap
    export function currentTilemap(): tiles.TileMapData {
        if (!game.currentScene().tileMap) return undefined;

        return game.currentScene().tileMap.data;
    }

    /**
     * Center the camera on a given tile location.
     */
    //% block="相机居中到 $location"
    //% blockId=tileUtil_createCameraOnTile
    //% group="相机" weight=10 blockGap=8
    //% location.shadow=mapgettile
    //% help=github:arcade-tile-util/docs/center-camera-on-tile
    export function centerCameraOnTile(location: tiles.Location) {
        scene.centerCameraAt(location.x, location.y);
    }

    /**
     * On each tile of a given kind, create a sprite of a given SpriteKind.
     * Useful to use with theon created [...]" sprite block.
     */
    //% block="在每个 $tileKind 瓦片上创建图片为 $spriteImage 类型为 $spriteKind 的精灵"
    //% blockId=tileUtil_createSpritesOnTiles
    //% tileKind.shadow=tileset_tile_picker
    //% tileKind.decompileIndirectFixedInstances=true
    //% spriteImage.shadow=screen_image_picker
    //% spriteKind.shadow=spritekind
    //% group="瓦片" weight=30 blockGap=8
    //% help=github:arcade-tile-util/docs/create-tiles-on-sprite
    export function createSpritesOnTiles(tileKind: Image, spriteImage: Image, spriteKind: number) {
        const scene = game.currentScene();

        // We call the handlers manually instead of just using
        // sprites.create() because we want to set the location
        // before the handlers are called
        const createdHandlers = scene.createdHandlers
            .filter(h => h.kind == spriteKind);

        for (const loc of tiles.getTilesByType(tileKind)) {
            const sprite = new Sprite(spriteImage);
            sprite.setKind(spriteKind);
            scene.physicsEngine.addSprite(sprite);
            tiles.placeOnTile(sprite, loc);

            for (const cb of createdHandlers) cb.handler(sprite)
        }
    }

    /**
     * Loops over each tile in a tilemap and runs the nested code
     *
     * @param tilemap The tilemap to loop over
     * @param handler The code to run
     */
    //% blockId=tileUtil_forEachTileInMap
    //% block="遍历 $tilemap 中每个瓦片 列 $column 行 $row 位置 $location"
    //% tilemap.shadow=tileUtil_getLoadedMap
    //% handlerStatement
    //% draggableParameters="reporter"
    //% group=瓦片
    //% weight=0
    //% help=github:arcade-tile-util/docs/for-each-tile-in-map
    export function forEachTileInMap(tilemap: tiles.TileMapData, handler: (column: number, row: number, location: tiles.Location) => void) {
        for (let c = 0; c < tilemap.width; c++) {
            for (let r = 0; r < tilemap.height; r++) {
                handler(c, r, new tiles.Location(c, r, null));
            }
        }
    }
}
