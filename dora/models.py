from django.contrib.gis.db import models

class Disease(models.Model):

	name = models.CharField(max_length=128)
	patient = models.ForeignKey('Patient')

	class Meta:
		ordering = ['name']

	def __unicode__(self):
		return self.name


class Patient(models.Model):

	given_name = models.CharField(max_length=128)
	family_name = models.CharField(max_length=128)
	dob = models.DateTimeField()
	gender = models.CharField(choices=(("M","M"),("F","F")), max_length=2)
	#image = models.ImageField(blank=True)
	latitude = models.FloatField()
	longitude = models.FloatField()

	def __unicode__(self):
		return self.given_name