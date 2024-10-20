# load data
import pandas as pd
df = pd.read_csv('data/disinfo_narratives_base_eng.csv')

# Schema
# {
#   “documentId”: “82",
#   “title”: “Misinformation narrative: {{NARRATIVE}}“,
#   “metadataJson”: “{\“fakeNews\“:\“{{FAKES}}\“}”,
#   “section”: [
#     {
#       “text”: “{{DEBUNKING}}”
#     }
#   ]
# }

import json
import os
import tqdm
document = {}
output_dir = 'output_json_files'
os.makedirs(output_dir, exist_ok=True)
for index, row in tqdm.tqdm(df.iterrows()):
    # cleanup the text
    debunking_text = row['Debunking'].replace('<p>', '').replace('</p>', '')
    fakes = row['Fakes']
    narrative = row['Narrative']
    document = {
        "documentId": f"{row['id']}",
        "title": f"Misinformation narrative: {narrative}",
        "metadataJson": json.dumps(
            {
                "fakeNews": fakes, 
                # "Narrative": narrative, 
                # "Debunking": debunking_text
             }
        ),
        "section": [
            {
                "text": f"{debunking_text}"
            }
        ]
    }
    
    # Write the JSON to a file
    with open(os.path.join(output_dir, f"narrative_{row['id']}.json"), 'w', encoding='utf-8') as f:
        json.dump(document, f, ensure_ascii=False, indent=2)

print(f"JSON files have been created in the '{output_dir}' directory.")