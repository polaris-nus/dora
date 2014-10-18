"""
Signals to update the dora app models whenever GPS locations are altered in the core models
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from mds.core.models import Observation
from mds.dora.models import EncounterLocation
from django.contrib.gis.geos import Point
import re

@receiver(post_save, sender=Observation)
def change_encounter_location(sender, **kwargs):
    created = kwargs.get("created")
    instance = kwargs.get("instance")
    
    if created and instance.concept.name == "LOCATION GPS":
        create_encounter_location_from_observation(instance)
        print "EncounterLocation created"
   
    #modified
    else:
        try:
            encounter_location = EncounterLocation.objects.get(observation=instance)
            encounter_location.delete()
            if instance.concept.name == "LOCATION GPS":
                create_encounter_location_from_observation(instance)
                print "EncounterLocation modified"
        except:
            pass
    
def create_encounter_location_from_observation(observation):

    gps_tuple = tuple(float(v) for v in re.findall(r'[-+]?[0-9]*\.?[0-9]+', observation.value_text))
    print gps_tuple
        
    if len(gps_tuple) >= 2:
        gps_location = Point(gps_tuple[0], gps_tuple[1])
        print gps_location
        encounter_location = EncounterLocation(encounter=observation.encounter, 
                                               coordinates=gps_location,
                                               observation=observation)
        encounter_location.save()