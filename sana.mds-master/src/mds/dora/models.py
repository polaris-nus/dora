from django.contrib.gis.db import models
from mds.core.models import Encounter, Observation

class EncounterLocation(models.Model):
	"""A mapping of encounters to the location of the encounters from its GPS location observation"""
	
	encounter = models.ForeignKey(Encounter, to_field='uuid', on_delete=models.CASCADE)
	
	coordinates = models.PointField(srid=4326)
	"""Using WGS84 coordinate system"""
	
	observation = models.ForeignKey(Observation, to_field='uuid', on_delete=models.CASCADE)