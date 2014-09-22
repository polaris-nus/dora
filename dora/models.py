from django.contrib.gis.db import models

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
	
	uuid = models.CharField(max_length=128, primary_key=True)
	"""Universally unique identifier"""
	
	patient = models.ForeignKey('Patient')
	
	disease = models.ForeignKey('Disease')
	
	created = models.DateTimeField()
	
	modified = models.DateTimeField()
	
	objects = models.GeoManager()
	
class Patient(models.Model):
	""" A medical patient """
	
	uuid = models.CharField(max_length=128, primary_key=True)
	"""Universally unique identifier"""
	
	given_name = models.CharField(max_length=128)
	
	family_name = models.CharField(max_length=128)
	
	dob = models.DateTimeField()
	
	gender = models.CharField(choices=(("M","M"),("F","F")), max_length=2)
	
	coordinates = models.PointField(null=True, srid=4326)
	
	date_last_updated_gps = models.DateTimeField(null=True)
	
	#image = models.ImageField(blank=True)

	def __unicode__(self):
		return self.given_name
	
class LastSynchronised(models.Model):

    last_synchronised = models.DateTimeField()
    
    def __unicode__(self):
        return self.last_synchronised.isoformat(' ')
    