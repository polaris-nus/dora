from django.contrib.gis.db import models
from mds.core.models import Encounter, Observation
from django.contrib.auth.models import User
from mds.api.utils import make_uuid

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
	
	uuid = models.SlugField(max_length=36, unique=True, default=make_uuid, editable=False)
	""" A universally unique identifier """
	
	alias = models.CharField(max_length=64)
	
	user = models.ForeignKey(User, on_delete=models.CASCADE)
	
	#the filter information in json format
	query = models.TextField()
	
	#location in JSON format
	location = models.TextField()
	
	created = models.DateTimeField(auto_now_add=True)
	""" When the object was created """