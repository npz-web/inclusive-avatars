## Info

hackrew is a framework for making character creator/dressup game applets a la [picrew](https://picrew.me/). You can check out an online demo [here](https://ksadov.github.io/hackrew/), or see a more complex version on [Neocities](https://cherrvak.neocities.org/furrycreator/index.html). To make your own character creator, fork this repo or download the files and follow the instructions below.

This builder uses hackrew as a base, and implements some accessibility improvements to allow more users to interact with it.

## Instructions

### Step 1: start a web server

The applet won't run correctly unless it's launched from a server. To launch it from your own machine, cd into the hackrew folder, run `./serve.sh` (you'll need [Python 3 installed on your machine](https://www.python.org/downloads/)) from the command line and navigate to [http://localhost:8000/](http://localhost:8000/) in your browser. Once you're done developing your character creator, you can host it on a remote server, like Neocities or Github Pages.

### Step 2: specify your parts

The character creator applet's visual components are comprised of "parts" (ex: "body", "ears", "tail", "accessories"), which have varieties called "items" (ex: the items for ears are "small" and "big"). Each item is represented by a .png image with a transparent background. The applet allows the user to create different characters by layering different item .pngs on top of each other.

Parts are listed in parts.json in the order in which they appear in the editor's UI. Their layer order is set manually with the `"layerOrder"` attribute. The part with the lowest layerOrder is rendered at the bottom of the stack, and the part with the highest layerOrder is rendered at the top.

- `"folder"`: the name of the folder that will contain the part's visual assets
- `"items"`: the names of the items belonging to the part
- `"colorMode"`: Can be `"fill"`, `"multiply"`, `"manual"` or `null`. See Step 3 for details.
- `"colorGroup"`: (Optional) the name of the color group that the part belongs to. When the color of one part in a color group is changed, all other parts in the group will change to the same color. NOTE: you still need to manually specify a list of `colors` for each part, and this list must be the same for each part in the group for it to function correctly.
- `"layerOrder"`: The order in which a part is rendered. Parts with lower layerOrder are rendered below parts with higher layerOrder.
- `"colors"`: 6-character strings containing the the hexcodes of colors. This can be omitted IF the part has the `colorGroup` attribute
- `"noneAllowed"`: `true` if this part is optional, false otherwise

Ex:

```
{ "folder": "ears",
      "items": ["small", "big"],
      "colorMode": "manual",
      "layerOrder": 10,
      "colors": ["FFFFFF", "FFBD6C", "BBDE49"],
      "noneAllowed": true
    }
```

OR

```
{ "folder": "ears",
      "items": ["small", "big"],
      "colorMode": "manual",
      "layerOrder": 10,
      "colorGroup": "skin",
      "noneAllowed": true
    }
```

#### Color Groups

This feature allows you to group parts together so that when the color of one part in the group is changed, all other parts in the group will change to the same color. To use this feature, you must specify a `colorGroup` attribute for each part in the group. The `colors` attribute can be omitted for each part in the group. You must also set up a list of hex codes in the `colorGroups` object in `parts.json`. Each key in the object is the name of a color group, and each value is a list of hex codes.

Ex:

```json
{
  "colorGroups": {
    "hair": [
      "f6f0e0",
      "fbeac5",
      "f5d5a1",
      "e7ba79",
      "b89f75",
      "947251"],
    "skin": [
      "f6f0e0",
      "fbeac5",
      "f5d5a1",
      "e7ba79",
      "b89f75",
      "947251"]
      },
  "parts": [ ...
```

### Step 3: create visual assets

All item .png files must have the same dimensions. To ensure that the items line up correctly when layered, I recommend drawing items on different layers of the same file in a digital art program like Gimp or Procreate, then saving each layer seperately as a .png.

Each part can come in multiple colors (ex: ears can be white, orange or green). For every part `part` and item `item`, the folder `imagemakerAssets/part` must contain a file named `item.png`. This file will represent the part in the part select menu. If the part has no color options, this file will also be used as an image for the character creator.

If a part has color options, then the `"colorMode"` field determines whether the item files for each color are manually or automatically generated.

To manually create color variants for each item of a part `part`, set `"colorMode`" to `"manual"` and for each item `item` and each color of hexcode `"XXXXXX"`, create a .png `imagemakerAssets/part/item_XXXXXX.png` depicting `item` in color `XXXXXX`.

To generate color variants automatically, you'll need to run the Python script `generate_colored_images.py`. The script uses files of the form `"imagemakerAssets/part/item.png`" as templates to generate colored versions of each item. If a part has `"colorMode"` `"fill"`, the script fills the template's pixels of RGB value `(123, 123, 123)` with the desired color, preserving alpha. If a part has `"colorMode"` `"multiply"`, the script treats the template as an alpha-preserving multiply layer over the desired color.

To run the Python script, you'll need [pipenv](https://pypi.org/project/pipenv/) installed and on your $PATH. Then from within the hackrew directory:

```
pipenv install
pipenv run python3 generate_colored_images.py

```

The script will take a while to run, but at the end you'll have your color variant image files in the correct folders.

### Step 4: edit the UI

To change the colors and graphics of the UI, edit the variables at the top of index.css.

### Step 5: host your avatar builder

The only files that you need to host your applet are index.html, index.css imagemaker.js, and the imagemakerAssets folder. To host on Github pages, fork this repo, customize the files, and follow the intrucutions [here](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site).

Since this repo generates a static site, you can turn on Github Pages in the Settings of the Repo and it should automatically deploy for you, detecting the presence of an index.html file. It will host your builder at `yourRepoName.github.io`. You can change the name of your repository to get a URL you like.

Pushing your changes to main will trigger a deploy.
