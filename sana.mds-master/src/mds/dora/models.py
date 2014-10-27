from django.contrib.gis.db import models
from mds.core.models import Encounter, Observation
from django.contrib.auth.models import User

class EncounterLocation(models.Model):
	"""A mapping of encounters to the location of the encounters from its GPS location observation"""
	
	encounter = models.ForeignKey(Encounter, to_field='uuid', on_delete=models.CASCADE)
	
	coordinates = models.PointField(srid=4326)
	"""Using WGS84 coordinate system"""
	objects = models.GeoManager()
	
	observation = models.ForeignKey(Observation, to_field='uuid', on_delete=models.CASCADE)
	
import mds.dora.signals

class SavedQuery(models.Model):
	"""A mapping of saved queries to the user who saved them"""
	
	user = models.ForeignKey(User, on_delete=models.CASCADE)
	
	query = models.TextField()
