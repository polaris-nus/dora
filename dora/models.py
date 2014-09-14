from django.contrib.gis.db import models

class Disease(models.Model):
	""" A disease """
	
	name = models.CharField(max_length=128)
	""" THe name of the disease """
	
	patients = models.ManyToManyField(Patient, through='Encounter')
	""" Patients diagnosed with this disease """

	class Meta:
		ordering = ['name']

	def __unicode__(self):
		return self.name

class Encounter(models.Model):
	""" A completed procedure, where data has been collected """
	
	patient = models.ForeignKey(Patient)
	
	disease = models.ForeignKey(Disease)
	
	created = models.DateTimeField
	
	modified = models.DateTimeField
	

class Patient(models.Model):
	""" A medical patient """
	
	given_name = models.CharField(max_length=128)
	
	family_name = models.CharField(max_length=128)
	
	dob = models.DateTimeField()
	
	gender = models.CharField(choices=(("M","M"),("F","F")), max_length=2)
	
	created = models.DateTimeField()
	
	modified = models.DateTimeField()
	
	#image = models.ImageField(blank=True)
	
	latitude = models.FloatField()
	
	longitude = models.FloatField()

	def __unicode__(self):
		return self.given_name