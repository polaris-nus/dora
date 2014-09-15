from django.contrib.gis.db import models
from datetime import datetime

class Disease(models.Model):
	""" A disease """
	
	name = models.CharField(max_length=128)
	""" The name of the disease """
	
	patients = models.ManyToManyField('Patient', through='Encounter')
	""" Patients diagnosed with this disease """

	class Meta:
		ordering = ['name']

	def __unicode__(self):
		return self.name

class Encounter(models.Model):
	""" A completed procedure, where data has been collected """
	
	patient = models.ForeignKey('Patient')
	
	disease = models.ForeignKey('Disease')
	
	created = models.DateTimeField()
	
	modified = models.DateTimeField()
	
	lon = models.FloatField(null=True)
	
	lat = models.FloatField(null=True)
	
	objects = models.GeoManager()
	
class Patient(models.Model):
	""" A medical patient """
	
	given_name = models.CharField(max_length=128)
	
	family_name = models.CharField(max_length=128)
	
	dob = models.DateTimeField()
	
	gender = models.CharField(choices=(("M","M"),("F","F")), max_length=2)
	
	#image = models.ImageField(blank=True)

	def __unicode__(self):
		return self.given_name
	
class LastSynchronised(models.Model):

    last_synchronised = models.DateTimeField()
    
    def __unicode__(self):
        return self.last_synchronised.isoformat(' ')
    
class PatientLookupTable(models.Model):
	
    uuid = models.CharField(max_length=128, primary_key=True)
    
    patient = models.ForeignKey('Patient')

class EncounterLookupTable(models.Model):
	
    uuid = models.CharField(max_length=128, primary_key=True)
    
    encounter = models.ForeignKey('Encounter')
    
    