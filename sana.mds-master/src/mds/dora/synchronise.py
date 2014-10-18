"""
To be run once before the dora app is used, just to populate the dora models with GPS information
"""

import re
from mds.core.models import Observation, Concept
from mds.dora.models import EncounterLocation
from datetime import datetime
from django.contrib.gis.geos import Point

def run():
    location_gps_concept = Concept.objects.get(name='LOCATION GPS')
    observations = Observation.objects.filter(concept=location_gps_concept)
    print observations
    
    for observation in observations:
        value_text = observation.value_text
        
        gps_tuple = tuple(float(v) for v in re.findall(r'[-+]?[0-9]*\.?[0-9]+', value_text))
        print gps_tuple
        
        if len(gps_tuple) >= 2:
            gps_location = Point(gps_tuple[0], gps_tuple[1])
            print gps_location
            encounter_location = EncounterLocation(encounter=observation.encounter,
                                                   coordinates=gps_location,
                                                   observation=observation)
            encounter_location.save()
