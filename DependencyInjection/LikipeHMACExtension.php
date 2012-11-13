<?php

namespace Likipe\HMACBundle\DependencyInjection;

use Symfony\Component\HttpKernel\DependencyInjection\Extension;
use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Loader\YamlFileLoader;
use Symfony\Component\Config\FileLocator;

class LikipeHMACExtension extends Extension
{
	public function load(array $configs, ContainerBuilder $container)
	{
		$loader = new YamlFileLoader($container, new FileLocator(__DIR__.'/../Resources/config'));
		
		$loader->load('services.yml');
		
		/* Default implementation for the RequestInfoProviderInterface */
		if( ! $container->has('hmac.requestInfoProvider')) {
			$container->register('hmac.requestInfoProvider', 'Likipe\HMACBundle\RequestInfoProvider\DefaultRequestInfoProvider');
		}
	}
}