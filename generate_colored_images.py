import json
import os 
from PIL import Image

with open('parts.json') as parts_json:
    parts = json.load(parts_json)['parts']

fillColor = (200, 200, 200)

# Prompt the user for a folder name
folder_name = input("Enter the folder name containing images: ")

def color_template_all():
    for part in parts:
        if (part['colorMode'] == "fill" or part['colorMode'] == "multiply"):
            print("Generating images for " + part['folder'] + "...")
            for item in part['items']:
                print("working on " + part['folder'] + ": " + item)

                fileprefix = "imagemakerAssets/" + part['folder'] +  "/" + item
                templatesource = fileprefix + ".png"
                with Image.open(templatesource) as template:
                    for color in part['colors']:
                        red = int(color[0:2], 16)
                        green = int(color[2:4], 16)
                        blue = int(color[4:6], 16)
                        colored_image = template.copy()
                        for y in range(template.height):
                            for x in range(template.width):
                                if (part['colorMode'] == "fill" and
                                    template.getpixel((x, y))[0] == fillColor[0] and
                                    template.getpixel((x, y))[1] == fillColor[1] and
                                    template.getpixel((x, y))[2] == fillColor[2]):
                                    alpha = template.getpixel((x, y))[3]
                                    colored_image.putpixel((x, y), (red, green, blue, alpha))
                                elif (part['colorMode'] == "multiply"):                           
                                    newred = int(((template.getpixel((x, y))[0])/255) * red)
                                    newgreen = int(((template.getpixel((x, y))[1])/255) * green)
                                    newblue = int(((template.getpixel((x, y))[2])/255) * blue)
                                    alpha = template.getpixel((x, y))[3]
                                    colored_image.putpixel((x, y), (newred, newgreen, newblue, alpha))                             
                        filename = fileprefix + "_" + color + ".png"
                        colored_image.save(filename, "PNG")
    print("Done.")

def color_template():
    for part in parts:
        if folder_name == part['folder']:
            if (part['colorMode'] == "fill" or part['colorMode'] == "multiply"):
                print("Generating images for " + part['folder'] + "...")
                for item in part['items']:
                    print("working on " + item)
                    fileprefix = "imagemakerAssets/" + part['folder'] +  "/" + item
                    templatesource = fileprefix + ".png"
                    with Image.open(templatesource) as template:
                        for color in part['colors']:
                            red = int(color[0:2], 16)
                            green = int(color[2:4], 16)
                            blue = int(color[4:6], 16)
                            colored_image = template.copy()
                            for y in range(template.height):
                                for x in range(template.width):
                                    if (part['colorMode'] == "fill" and
                                        template.getpixel((x, y))[0] == fillColor[0] and
                                        template.getpixel((x, y))[1] == fillColor[1] and
                                        template.getpixel((x, y))[2] == fillColor[2]):
                                        alpha = template.getpixel((x, y))[3]
                                        colored_image.putpixel((x, y), (red, green, blue, alpha))
                                    elif (part['colorMode'] == "multiply"):                           
                                        newred = int(((template.getpixel((x, y))[0])/255) * red)
                                        newgreen = int(((template.getpixel((x, y))[1])/255) * green)
                                        newblue = int(((template.getpixel((x, y))[2])/255) * blue)
                                        alpha = template.getpixel((x, y))[3]
                                        colored_image.putpixel((x, y), (newred, newgreen, newblue, alpha))                             
                            filename = fileprefix + "_" + color + ".png"
                            colored_image.save(filename, "PNG")
    print("Done.")


if folder_name == "":
    color_template_all()
else:
    color_template()
